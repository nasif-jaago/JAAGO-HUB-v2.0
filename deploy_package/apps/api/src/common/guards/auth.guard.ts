import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtVerifier } from "@jaago/auth";
import { IS_PUBLIC_KEY } from "../decorators/require-permission.decorator.js";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector = new Reflector()) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers["authorization"] as string | undefined;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing or invalid Authorization header");
    }

    const token = authHeader.substring(7).trim();
    const payload = JwtVerifier.decodePayload(token);

    if (!payload) {
      throw new UnauthorizedException("Invalid JWT token");
    }

    const user = JwtVerifier.toAuthUser(payload);
    request.user = user;

    return true;
  }
}
