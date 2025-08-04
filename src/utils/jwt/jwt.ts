import JWT, {
  DecodeOptions,
  JsonWebTokenError,
  NotBeforeError,
  SignOptions,
  TokenExpiredError,
  VerifyOptions,
} from 'jsonwebtoken';
import { z } from 'zod';

export {
  DecodeOptions,
  JsonWebTokenError,
  NotBeforeError,
  SignOptions,
  TokenExpiredError,
  VerifyOptions,
} from 'jsonwebtoken';

export type Payload = object;

export type DecodedToken<T extends Payload> = T & {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
};

export function isTokenExpiredError(error: unknown): error is TokenExpiredError {
  return error instanceof Error && error.name === 'TokenExpiredError';
}

export function isJsonWebTokenError(error: unknown): error is JsonWebTokenError {
  return error instanceof Error && error.name === 'JsonWebTokenError';
}

export function isNotBeforeError(error: unknown): error is NotBeforeError {
  return error instanceof Error && error.name === 'NotBeforeError';
}

export function isJwtError(error: unknown) {
  return isTokenExpiredError(error) || isJsonWebTokenError(error) || isNotBeforeError(error);
}

export function useJwt(secret: JWT.Secret) {
  /**
   * Returns the JsonWebToken as string
   */
  function sign(payload: Payload, options?: SignOptions) {
    return JWT.sign(payload, secret, options);
  }

  /**
   * Returns the payload decoded if the signature is valid and optional expiration, audience, or issuer are valid.
   * If not, it will throw the error.
   */
  function verify<T extends Payload>(token: string, options?: VerifyOptions) {
    return JWT.verify(token, secret, options) as DecodedToken<T>;
  }

  /**
   * Returns the decoded payload **without verifying if the signature is valid**.
   */
  function decode<T extends Payload>(token: string, options?: DecodeOptions) {
    return JWT.decode(token, options) as null | DecodedToken<T>;
  }

  return { sign, decode, verify };
}

export function useZodJwt<S extends z.ZodType<object>, T extends Payload = z.TypeOf<S>>(schema: S, secret: JWT.Secret) {
  const superJwt = useJwt(secret);

  /**
   * Returns the JsonWebToken as string
   */
  function sign(payload: T, options?: SignOptions) {
    const parsedPayload = schema.parse(payload);
    return superJwt.sign(parsedPayload, options);
  }

  /**
   * Returns the payload decoded if the signature is valid and optional expiration, audience, or issuer are valid.
   * If not, it will throw the error.
   */

  function verify(token: string, options?: VerifyOptions) {
    const decoded = superJwt.verify<T>(token, options);
    schema.parse(decoded);
    return decoded;
  }

  /**
   * Returns the decoded payload **without verifying if the signature is valid**.
   */
  function decode(token: string, options?: DecodeOptions) {
    const decoded = superJwt.decode<T>(token, options);
    if (decoded) schema.parse(decoded);
    return decoded;
  }

  return { sign, decode, verify };
}
