import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  BadRequestException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { AuthUser, TenantContext } from "@jaago/shared-types";
import { IS_PUBLIC_KEY } from "../decorators/require-permission.decorator.js";

@Injectable()
export class TenantContextGuard implements CanActivate {
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
    const user = request.user as AuthUser | undefined;

    const orgIdHeader = request.headers["x-org-id"] as string | undefined;
    const orgId = orgIdHeader || user?.orgId;

    if (!orgId) {
      throw new BadRequestException("Organization tenant context (X-Org-ID or user org_id) is required");
    }

    const tenant: TenantContext = {
      orgId,
      userId: user?.id ?? "anonymous",
      role: user?.roles?.[0] ?? "authenticated",
    };

    request.tenant = tenant;
    return true;
  }
}
