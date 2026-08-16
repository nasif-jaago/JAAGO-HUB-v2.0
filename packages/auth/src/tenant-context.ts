import { AsyncLocalStorage } from "node:async_hooks";
import type { TenantContext, AuthUser } from "@jaago/shared-types";

export interface RequestSecurityContext {
  tenant: TenantContext;
  user: AuthUser;
  correlationId: string;
}

const asyncLocalStorage = new AsyncLocalStorage<RequestSecurityContext>();

export class TenantContextHolder {
  /**
   * Run a function with the specified security context.
   */
  static run<R>(context: RequestSecurityContext, fn: () => R): R {
    return asyncLocalStorage.run(context, fn);
  }

  /**
   * Get the current security context from AsyncLocalStorage.
   */
  static getContext(): RequestSecurityContext | undefined {
    return asyncLocalStorage.getStore();
  }

  /**
   * Get the current org ID or throw if not in a tenant context.
   */
  static getOrgId(): string {
    const ctx = this.getContext();
    if (!ctx?.tenant.orgId) {
      throw new Error("No active tenant context found in current execution flow");
    }
    return ctx.tenant.orgId;
  }

  /**
   * Get the current user or throw if unauthenticated.
   */
  static getUser(): AuthUser {
    const ctx = this.getContext();
    if (!ctx?.user) {
      throw new Error("No active authenticated user found in current execution flow");
    }
    return ctx.user;
  }
}
