import bcrypt, { hashSync } from "bcrypt";
import { RefreshToken } from "../model/refreshToken";
import { Role, User } from "../model/user";
import { MongoCollection, ObjectId } from "../../utils/mongo/MongoCollection";
import { createResetToken, createTokens, RefreshTokenPayload, ResetTokenPayload, verify, verifyResetToken } from "../../utils/jwt/jwtHelper";
import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from "../../utils/HttpException";
import { AccountResetPassword, AccountResetPasswordToken, AuthResponse, RegisterRequest, UpdateUserRequest, UserResponse } from "../dto/auth.dto";
import { sendPasswordResetEmail } from "../../notification/service/brevo.service";
import appConfig from "../../app.config";
import { CreateUserWithoutPasswordRequest } from "../controller/auth.controller";

export const loginUser = async (params: {
  email: string,
  password: string
}): Promise<AuthResponse> => {
  const { email, password } = params;
  const usersCollection = getUsersCollection();
  const user = await usersCollection.findOne({ email });
  if (!user) {
    throw new UnauthorizedException("Invalid credentials");
  }
  await validatePassword(password, user.password);
  const tokens = createTokens(user);
  await saveRefreshToken({ _id: user._id, refreshToken: tokens.refreshToken });
  return tokens
}

export const getMe = async (userId: string): Promise<UserResponse> => {
  const user = await getUsersCollection().findOneById(userId);
  return convertToUserResponse(user);
}

const convertToUserResponse = (user: User): UserResponse => {
  return {
    _id: user._id.toString(),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    code: user.code,
    jobId: user.jobId?.toString() ?? null,
    managerUserId: user.managerUserId?.toString() ?? null,
    roles: user.roles,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

export const createUser = async (
  params: RegisterRequest
): Promise<AuthResponse> => {
  const { email, password, firstName, lastName, code, jobId } = params;
  const existingUser = await getUsersCollection().findOne({ email });
  if (existingUser) {
    throw new ConflictException("User already exists");
  }

  const hashedPassword = await hashPassword(password);
  const newUser: User = {
    _id: new ObjectId(),
    email,
    password: hashedPassword,
    firstName,
    lastName,
    code,
    jobId: jobId ? new ObjectId(jobId) : null,
    managerUserId: null,
    roles: ["USER"] as Role[],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const user = await getUsersCollection().insertOne(newUser);
  const tokens = createTokens(user);
  await saveRefreshToken({ _id: user._id, refreshToken: tokens.refreshToken });
  return tokens
}

export const createUserWithoutPassword = async (
  params: CreateUserWithoutPasswordRequest
): Promise<UserResponse> => {
  const { email, firstName, lastName, code } = params;
  const existingUser = await getUsersCollection().findOne({ email });
  if (existingUser) {
    throw new ConflictException("User already exists");
  }

  // Generate a random password that will be changed on first login
  const randomPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = await hashPassword(randomPassword);

  const newUser: User = {
    _id: new ObjectId(),
    email,
    password: hashedPassword,
    firstName,
    lastName,
    code,
    jobId: null,
    managerUserId: null,
    roles: ["USER"] as Role[],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const user = await getUsersCollection().insertOne(newUser);

  // Send password reset email to the new user
  const token = createResetToken(user);
  const urlReset = `${appConfig.webapp.resetUrl}?token=${token}`;
  await sendPasswordResetEmail(user.email, { urlReset }, user.firstName);

  return convertToUserResponse(user);
}

export const refreshToken = async (refreshToken: string): Promise<AuthResponse> => {
  const storedToken = await findRefreshToken(refreshToken);
  if (!storedToken) {
    throw new UnauthorizedException("Invalid refresh token");
  }
  if (storedToken.expiresAt < new Date()) {
    await deleteRefreshToken(refreshToken);
    throw new UnauthorizedException("Refresh token expired");
  }
  try {
    const { _id } = verify<RefreshTokenPayload>(refreshToken);
    const user = await getUsersCollection().findOneById(_id);
    const newTokens = createTokens(user);
    // await deleteRefreshToken(refreshToken);
    // await saveRefreshToken({ _id: user._id, refreshToken: newTokens.refreshToken });
    return newTokens;
  } catch (_tokenError) {
    console.error(_tokenError);
    throw new UnauthorizedException("Invalid refresh token");
  }
}

export async function getResetPasswordToken(resetPasswordToken: AccountResetPasswordToken, url: string): Promise<void> {
  const email = resetPasswordToken.email.toLowerCase();
  const user = await getUsersCollection().findOne({ email });
  if (!user) throw new NotFoundException(`No user found for this email address: ${email}`);
  const token = createResetToken(user);
  const urlReset = `${url}?token=${token}`;
  await sendPasswordResetEmail(user.email, { urlReset }, user.firstName);
}

export async function resetPassword(resetPassword: AccountResetPassword): Promise<void> {
  let decodedToken;
  try {
    decodedToken = verifyResetToken<ResetTokenPayload>(resetPassword.token);
  } catch {
    throw new BadRequestException('Invalid reset token');
  }
  const user = await getUsersCollection().findOneById(decodedToken._id);
  user.password = hashSync(resetPassword.password, 10);
  await getUsersCollection().update(user)
}

export async function getUsers(): Promise<UserResponse[]> {
  const users = await getUsersCollection().find({});
  return users.map(convertToUserResponse);
}

export async function updateUser(
  _id: string,
  params: UpdateUserRequest
): Promise<UserResponse> {
  const { firstName, lastName, jobId, managerUserId, roles } = params;
  const existingUser = await getUsersCollection().findOneById(_id);
  if (!existingUser) {
    throw new NotFoundException("User not found");
  }

  console.log({ firstName, lastName, jobId, managerUserId, roles });

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (firstName !== undefined) {
    updateData.firstName = firstName;
  }
  if (lastName !== undefined) {
    updateData.lastName = lastName;
  }
  if (roles !== undefined) {
    updateData.roles = roles;
  }
  if (managerUserId !== undefined) {
    updateData.managerUserId = managerUserId ? new ObjectId(managerUserId) : null;
  }
  if (jobId !== undefined) {
    updateData.jobId = jobId ? new ObjectId(jobId) : null;
  }

  const updatedUser = await getUsersCollection().findOneAndUpdate(
    { _id: new ObjectId(_id) },
    updateData
  );

  return convertToUserResponse(updatedUser);
}

export async function deleteUserById(id: string): Promise<void> {
  const userCollection = getUsersCollection();
  const refreshTokenCollection = getRefreshTokensCollection();

  // remove ManagerUserId of all users that have the managerUserId equal to the id
  const usersManaged = await userCollection.find({ managerUserId: new ObjectId(id) });
  const usersManagedUpdated = usersManaged.map(user => ({ ...user, managerUserId: null }));
  await userCollection.updateMany(usersManagedUpdated);

  // delete all refresh tokens of the user
  await refreshTokenCollection.deleteMany({ userId: new ObjectId(id) });
  await userCollection.deleteOne({ _id: new ObjectId(id) });
}

export async function getAllManagers(): Promise<UserResponse[]> {
  const userCollection = getUsersCollection();
  const users = await userCollection.find({ roles: { $in: ['MANAGER'] } });
  return users.map(convertToUserResponse);
}

export async function searchUsers(params: {
  q?: string;
  skillName?: string;
  jobName?: string;
  observedLevel?: string;
  jobIds?: string[];
}): Promise<UserResponse[]> {
  const { q, skillName, jobName, observedLevel, jobIds } = params;

  const pipeline: any[] = [];

  if (q && q.trim().length > 0) {
    const regex = new RegExp(q, 'i');
    pipeline.push({
      $match: {
        $or: [
          { firstName: { $regex: regex } },
          { lastName: { $regex: regex } },
          { email: { $regex: regex } },
          { code: { $regex: regex } },
        ],
      },
    });
  }

  if ((jobName && jobName.trim().length > 0) || (jobIds && jobIds.length > 0)) {
    const jobRegex = jobName ? new RegExp(jobName, 'i') : undefined;
    pipeline.push(
      { $lookup: { from: 'job', localField: 'jobId', foreignField: '_id', as: 'job' } },
      { $unwind: '$job' },
      ...(jobRegex ? [{ $match: { 'job.name': { $regex: jobRegex } } }] : []),
      ...(jobIds && jobIds.length > 0
        ? [{ $match: { 'job._id': { $in: jobIds.filter(Boolean).map((id) => new ObjectId(id)) } } }]
        : []),
    );
  }

  if ((skillName && skillName.trim().length > 0) || (observedLevel && observedLevel.trim().length > 0)) {
    const skillStages: any[] = [
      { $lookup: { from: 'evaluation', localField: '_id', foreignField: 'userId', as: 'evals' } },
      { $unwind: '$evals' },
      { $lookup: { from: 'evaluation_skill', localField: 'evals._id', foreignField: 'evaluationId', as: 'evalSkills' } },
      { $unwind: '$evalSkills' },
    ];
    if (skillName && skillName.trim().length > 0) {
      const skillRegex = new RegExp(skillName, 'i');
      skillStages.push(
        { $lookup: { from: 'skill', localField: 'evalSkills.skillId', foreignField: '_id', as: 'skill' } },
        { $unwind: '$skill' },
        { $match: { 'skill.name': { $regex: skillRegex } } },
      );
    }
    if (observedLevel && observedLevel.trim().length > 0) {
      skillStages.push({ $match: { 'evalSkills.observedLevel': observedLevel } });
    }
    pipeline.push(...skillStages);

    // Group back to user unique
    pipeline.push(
      { $group: { _id: '$_id', doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } },
    );
  }

  const usersCollection = getUsersCollection();
  const cursor = usersCollection.aggregate<User & any>(pipeline.length > 0 ? pipeline : [{ $match: {} }]);
  const results = await cursor.toArray();
  return results.map(convertToUserResponse);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

function getUsersCollection(): MongoCollection<User> {
  return new MongoCollection<User>("user");
}

function getRefreshTokensCollection(): MongoCollection<RefreshToken> {
  return new MongoCollection<RefreshToken>("refresh_token");
}

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function validatePassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  const isValid = await bcrypt.compare(password, hashedPassword);
  if (!isValid) {
    throw new UnauthorizedException("Invalid credentials");
  }
  return isValid;
}

async function saveRefreshToken(
  params: {
    _id: ObjectId,
    refreshToken: string,
  }
): Promise<void> {
  const { _id: userId, refreshToken } = params;
  const refreshTokenCollection = getRefreshTokensCollection();
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30); // 30 days from now
  await refreshTokenCollection.insertOne({
    _id: new ObjectId(),
    refreshToken,
    userId,
    createdAt: new Date(),
    expiresAt: expiryDate,
  });
}

async function findRefreshToken(
  refreshToken: string,
): Promise<RefreshToken | null> {
  const refreshTokenCollection = getRefreshTokensCollection();
  return refreshTokenCollection.findOne({ refreshToken });
}

async function deleteRefreshToken(refreshToken: string): Promise<void> {
  const refreshTokenCollection = getRefreshTokensCollection();
  await refreshTokenCollection.deleteOne({ refreshToken });
}

