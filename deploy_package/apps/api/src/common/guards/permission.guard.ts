import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { hasAllPermissions } from "@jaago/auth";
import type { AuthUser } from "@jaago/shared-types";
import { PERMISSION_METADATA_KEY } from "../decorators/require-permission.decorator.js";

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector = new Reflector()) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSION_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No specific permissions required for this route
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;

    if (!user) {
      throw new ForbiddenException("Unauthenticated user cannot access protected resource");
    }

    const hasAccess = hasAllPermissions(user, requiredPermissions);

    if (!hasAccess) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredPermissions.join(", ")}`,
      );
    }

    return true;
  }
}
