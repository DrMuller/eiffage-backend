import bcrypt, { hashSync } from "bcrypt";
import { RefreshToken } from "../model/refreshToken";
import { Role, User } from "../model/user";
import { MongoCollection, ObjectId } from "../../utils/mongo/MongoCollection";
import { createResetToken, createTokens, RefreshTokenPayload, ResetTokenPayload, verify, verifyResetToken } from "../../utils/jwt/jwtHelper";
import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from "../../utils/HttpException";
import { AccountResetPassword, AccountResetPasswordToken, AuthResponse, UserResponse } from "../dto/auth.dto";
import { sendPasswordResetEmail } from "../../notification/service/brevo.service";
import appConfig from "../../app.config";

export const loginUser = async (params: {
  email: string,
  password: string
}): Promise<AuthResponse> => {
  const { email, password } = params;
  const usersCollection = getUsersCollection();
  const user = await usersCollection.findOneOrFail({ email });
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
    roles: user.roles,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

export const createUser = async (
  params: {
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  }
): Promise<AuthResponse> => {
  const { email, password, firstName, lastName } = params;
  const existingUser = await getUsersCollection().findOne({ email });
  if (existingUser) {
    throw new ConflictException("User already exists");
  }

  const hashedPassword = await hashPassword(password);
  const newUser = {
    _id: new ObjectId(),
    email,
    password: hashedPassword,
    firstName,
    lastName,
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
  params: {
    email: string,
    firstName: string,
    lastName: string,
  }
): Promise<UserResponse> => {
  const { email, firstName, lastName } = params;
  const existingUser = await getUsersCollection().findOne({ email });
  if (existingUser) {
    throw new ConflictException("User already exists");
  }

  // Generate a random password that will be changed on first login
  const randomPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = await hashPassword(randomPassword);

  const newUser = {
    _id: new ObjectId(),
    email,
    password: hashedPassword,
    firstName,
    lastName,
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
  } catch (e) {
    throw new BadRequestException('Invalid reset token');
  }
  const user = await getUsersCollection().findOneById(decodedToken._id);
  user.password = hashSync(resetPassword.password, 10);
  await getUsersCollection().update(user)
}

export const getUsers = async (): Promise<UserResponse[]> => {
  const users = await getUsersCollection().find({});
  return users.map(convertToUserResponse);
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

