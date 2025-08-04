import { Role, User } from '../../auth/model/user';
import appConfig from '../../app.config';
import { SignOptions } from 'jsonwebtoken';
import { useJwt } from './jwt';

const Jwt = useJwt(appConfig.jwt.secret);
const JwtReset = useJwt(appConfig.jwt.resetSecret);

export interface RefreshTokenPayload {
    _id: string;
}

export interface AccessTokenPayload {
    _id: string;
    email: string;
    roles: Role[];
}

export interface ResetTokenPayload {
    _id: string;
    email: string;
}

export function verify<T extends object>(token: string) {
    return Jwt.verify<T>(token);
}

export function verifyResetToken<T extends object>(token: string) {
    return JwtReset.verify<T>(token);
}

export function createResetToken(user: User): string {
    const payload: ResetTokenPayload = { _id: user._id.toString(), email: user.email };
    return JwtReset.sign(payload, { expiresIn: appConfig.jwt.resetTokenExp });
}

export function createAccessToken(user: User, options: SignOptions = {}): string {
    const userContext: AccessTokenPayload = {
        _id: user._id.toString(),
        email: user.email,
        roles: user.roles
    };
    return Jwt.sign(userContext, { expiresIn: appConfig.jwt.accessTokenExp, ...options });
}

export function createRefreshToken(user: User, options: SignOptions = {}): string {
    const payload: RefreshTokenPayload = { _id: user._id.toString() };
    return Jwt.sign(payload, { expiresIn: appConfig.jwt.refreshTokenExp, ...options });
}

export type Tokens = {
    accessToken: string;
    refreshToken: string;
};

export function createTokens(
    user: User,
    options: { accessTokenOptions?: SignOptions; refreshTokenOptions?: SignOptions } = {}
): Tokens {
    const { accessTokenOptions, refreshTokenOptions } = options;
    const token = createAccessToken(user, accessTokenOptions);
    const refreshToken = createRefreshToken(user, refreshTokenOptions);
    return {
        accessToken: token,
        refreshToken: refreshToken,
    };
}
