import { RequestHandler } from 'express';
import { Role } from '../auth/model/user';
import { AccessTokenPayload, verify } from '../utils/jwt/jwtHelper';
import { UnauthorizedException, ForbiddenException } from '../utils/HttpException';
import Context from '../utils/express/Context';

export default function jwtMiddleware(roles: Array<Role>): RequestHandler {
  return async (req, res, next): Promise<any> => {
    try {
      const authHeader = req.headers.authorization;
      const { originalUrl, method } = req;
      if (!authHeader || !(authHeader.split(' ')[0] === 'Bearer')) {
        return next(new UnauthorizedException(`${method} ${originalUrl} needs authentication`));
      }

      let tokenDecoded;
      try {
        tokenDecoded = verify<AccessTokenPayload>(authHeader.split(' ')[1]);
      } catch (e) {
        return next(new UnauthorizedException('Invalid jwt'));
      }

      const rolesDecoded = (tokenDecoded.roles || []) as Array<string>;
      const rolesIntersections = roles.filter((role) => rolesDecoded.includes(role));
      if (rolesIntersections.length === 0) {
        return next(new ForbiddenException('Invalid role'));
      }

      req.context = new Context(tokenDecoded);
      next();
    } catch (error) {
      // Catch any unexpected errors to prevent server termination
      console.error('Error in JWT middleware:', error);
      next(error);
    }
  };
}
