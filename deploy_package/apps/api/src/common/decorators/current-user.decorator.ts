import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { AuthUser, TenantContext } from "@jaago/shared-types";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthUser | undefined;
  },
);

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TenantContext | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenant as TenantContext | undefined;
  },
);
