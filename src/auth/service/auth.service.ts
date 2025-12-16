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
import { createPaginatedResponse, PaginatedResponse, PaginationParams } from "../../utils/pagination/pagination.helper";

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

export const getUserById = async (userId: string): Promise<UserResponse> => {
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
    managerUserIds: user.managerUserIds.map(id => id.toString()),
    gender: user.gender,
    seniority: user.seniority,
    age: user.age,
    companyCode: user.companyCode,
    companyName: user.companyName,
    establishmentCode: user.establishmentCode,
    establishmentName: user.establishmentName,
    roles: user.roles,
    invitedAt: user.invitedAt,
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
    managerUserIds: [],
    gender: 'MALE',
    birthDate: new Date('1970-01-01'),
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
    managerUserIds: [],
    gender: 'MALE',
    birthDate: new Date('1970-01-01'),
    roles: ["USER"] as Role[],
    invitedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const user = await getUsersCollection().insertOne(newUser);

  // Send password reset email to the new user
  const token = createResetToken(user);
  const urlReset = `${appConfig.webapp.webappUrl}/auth/reset-password?token=${token}`;
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

export async function getUsers(pagination?: PaginationParams, managerUserId?: string): Promise<PaginatedResponse<UserResponse>> {
  const usersCollection = getUsersCollection();

  if (!pagination) {
    const users = await usersCollection.find({});
    const userResponses = users.map(convertToUserResponse);
    return createPaginatedResponse(userResponses, 1, userResponses.length, userResponses.length);
  }

  const { page, limit, skip } = pagination;
  const total = await usersCollection.count(managerUserId ? { managerUserIds: new ObjectId(managerUserId) } : {});
  const users = await usersCollection.find(managerUserId ? { managerUserIds: new ObjectId(managerUserId) } : {}, { skip, limit, sort: { createdAt: -1 } });
  const userResponses = users.map(convertToUserResponse);

  return createPaginatedResponse(userResponses, page, limit, total);
}

export async function updateUser(
  _id: string,
  params: UpdateUserRequest
): Promise<UserResponse> {
  const { firstName, lastName, jobId, managerUserIds, roles } = params;
  const existingUser = await getUsersCollection().findOneById(_id);
  if (!existingUser) {
    throw new NotFoundException("User not found");
  }

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
  if (managerUserIds !== undefined) {
    updateData.managerUserIds = managerUserIds.map(id => new ObjectId(id));
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

  // Remove this manager from all users that have them in their managerUserIds array
  const usersManaged = await userCollection.find({ managerUserIds: new ObjectId(id) });
  const usersManagedUpdated = usersManaged.map(user => ({
    ...user,
    managerUserIds: user.managerUserIds.filter(managerId => !managerId.equals(new ObjectId(id)))
  }));
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
  gender?: 'MALE' | 'FEMALE';
  establishmentName?: string;
  managerUserId?: string;
  ageMin?: number;
  ageMax?: number;
  seniorityMin?: number;
  seniorityMax?: number;
  skills?: Array<{ skillId: string; minLevel: number }>
}, pagination?: PaginationParams): Promise<PaginatedResponse<UserResponse>> {
  const { q, skillName, jobName, observedLevel, jobIds, skills, gender, establishmentName, managerUserId, ageMin, ageMax, seniorityMin, seniorityMax } = params;

  const pipeline: any[] = [];
  // SIRH fields filters
  if (managerUserId) {
    pipeline.push({ $match: { managerUserIds: new ObjectId(managerUserId) } });
  }
  if (gender) {
    pipeline.push({ $match: { gender } });
  }
  if (establishmentName && establishmentName.trim().length > 0) {
    pipeline.push({ $match: { establishmentName: { $regex: new RegExp(establishmentName, 'i') } } });
  }
  if (Number.isFinite(ageMin) || Number.isFinite(ageMax)) {
    const cond: any = {};
    if (Number.isFinite(ageMin)) cond.$gte = ageMin;
    if (Number.isFinite(ageMax)) cond.$lte = ageMax;
    pipeline.push({ $match: { age: cond } });
  }
  if (Number.isFinite(seniorityMin) || Number.isFinite(seniorityMax)) {
    const cond: any = {};
    if (Number.isFinite(seniorityMin)) cond.$gte = seniorityMin;
    if (Number.isFinite(seniorityMax)) cond.$lte = seniorityMax;
    pipeline.push({ $match: { seniority: cond } });
  }

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

  const useLegacySkillFilter = (!skills || skills.length === 0) && ((skillName && skillName.trim().length > 0) || (observedLevel && observedLevel.trim().length > 0));
  if (useLegacySkillFilter) {
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

  // New multi-skill ALL (AND) with min level filter
  if (skills && skills.length > 0) {
    const requiredIds = skills.map(s => new ObjectId(s.skillId));
    pipeline.push(
      { $lookup: { from: 'evaluation', localField: '_id', foreignField: 'userId', as: 'evals' } },
      { $unwind: '$evals' },
      { $lookup: { from: 'evaluation_skill', localField: 'evals._id', foreignField: 'evaluationId', as: 'evalSkills' } },
      { $unwind: '$evalSkills' },
      {
        $match: {
          $or: skills.map(s => ({
            $and: [
              { 'evalSkills.skillId': new ObjectId(s.skillId) },
              { 'evalSkills.observedLevel': { $gte: s.minLevel } },
            ]
          }))
        }
      },
      {
        $group: {
          _id: '$_id',
          doc: { $first: '$$ROOT' },
          matchedSkillIds: { $addToSet: '$evalSkills.skillId' }
        }
      },
      {
        $match: {
          $expr: { $setIsSubset: [requiredIds, '$matchedSkillIds'] }
        }
      },
      { $replaceRoot: { newRoot: '$doc' } },
    );
  }

  const usersCollection = getUsersCollection();

  // If pagination is requested, we need to count first
  if (pagination) {
    const { page, limit, skip } = pagination;

    // Count total matching documents
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countCursor = usersCollection.aggregate<{ total: number }>(countPipeline.length > 1 ? countPipeline : [{ $match: {} }, { $count: 'total' }]);
    const countResults = await countCursor.toArray();
    const total = countResults.length > 0 ? countResults[0].total : 0;

    // Add pagination to main pipeline
    pipeline.push({ $skip: skip }, { $limit: limit });

    const cursor = usersCollection.aggregate<User & any>(pipeline.length > 0 ? pipeline : [{ $match: {} }]);
    const results = await cursor.toArray();
    const userResponses = results.map(convertToUserResponse);
    return createPaginatedResponse(userResponses, page, limit, total);
  }

  // Non-paginated request
  const cursor = usersCollection.aggregate<User & any>(pipeline.length > 0 ? pipeline : [{ $match: {} }]);
  const results = await cursor.toArray();
  const userResponses = results.map(convertToUserResponse);
  return createPaginatedResponse(userResponses, 1, userResponses.length, userResponses.length);
}

export async function getTeamMembers(managerId: string): Promise<UserResponse[]> {
  const userCollection = getUsersCollection();
  const teamMembers = await userCollection.find({
    managerUserIds: new ObjectId(managerId)
  });
  return teamMembers.map(convertToUserResponse);
}

export async function sendUserInvite(userId: string, role?: 'ADMIN' | 'MANAGER', webapp: 'main' | 'evaluation' = 'main'): Promise<{ to: string; subject: string; body: string }> {
  const usersCollection = getUsersCollection();
  const user = await usersCollection.findOneById(userId);
  if (!user) {
    throw new NotFoundException("User not found");
  }

  // Prepare the update object
  const updateData: Partial<User> = {
    invitedAt: new Date(),
    updatedAt: new Date(),
  };

  // If a role is provided, add it to the user's roles
  if (role) {
    const currentRoles = Array.isArray(user.roles) ? user.roles : ['USER'];
    // Add the new role if it's not already present, and ensure USER is always included
    const newRoles = Array.from(new Set([...currentRoles, role, 'USER']));
    updateData.roles = newRoles as Role[];
  }

  // Update invitedAt timestamp and roles if provided
  await usersCollection.findOneAndUpdate(
    { _id: new ObjectId(userId) },
    updateData
  );

  const token = createResetToken(user);
  // Select the appropriate reset URL based on the webapp
  const resetUrl = webapp === 'evaluation'
    ? appConfig.webapp.evaluationWebappUrl
    : appConfig.webapp.webappUrl;
  const urlReset = `${resetUrl}/auth/reset-password?token=${token}`;

  // Comment out the actual email sending
  // await sendPasswordResetEmail(user.email, { urlReset }, user.firstName);

  // Return the email content for mailto link
  const roleName = role === 'ADMIN' ? 'Administrateur RH' : role === 'MANAGER' ? 'Manager' : 'Utilisateur';

  const subject = `Invitation à rejoindre l'outil de gestion des compétences Eiffage`;
  const body = `Bonjour ${user.firstName},

Vous avez été invité(e) à rejoindre l'outil de gestion des compétences Eiffage avec le rôle de ${roleName}.

Pour créer votre mot de passe et accéder à votre compte, veuillez cliquer sur le lien suivant :

${urlReset}

Ce lien est valable pendant 7 jours.

Une fois votre compte activé, vous pourrez accéder aux applications suivantes :
	•	Webapp d’évaluation : ${appConfig.webapp.evaluationWebappUrl}
	•	Webapp RH : ${appConfig.webapp.webappUrl}

Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.

Cordialement,
L'équipe Eiffage`;

  return {
    to: user.email,
    subject,
    body
  };
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

