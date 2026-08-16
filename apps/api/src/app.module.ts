import { Module } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from "@nestjs/core";
import { AuthGuard } from "./common/guards/auth.guard.js";
import { TenantContextGuard } from "./common/guards/tenant-context.guard.js";
import { PermissionGuard } from "./common/guards/permission.guard.js";
import { CorrelationIdInterceptor } from "./common/interceptors/correlation-id.interceptor.js";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor.js";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor.js";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter.js";
import { HealthController } from "./health/health.controller.js";
import { DemoController } from "./demo/demo.controller.js";
import { AdminModule } from "./modules/admin/admin.module.js";
import { ApiAuthModule } from "./modules/auth/auth.module.js";
import { AuditModule } from "./modules/audit/audit.module.js";
import { NotificationsModule } from "./modules/notifications/notifications.module.js";
import { ApprovalsModule } from "./modules/approvals/approvals.module.js";
import { HrModule } from "./modules/hr/hr.module.js";

@Module({
  imports: [AdminModule, ApiAuthModule, AuditModule, NotificationsModule, ApprovalsModule, HrModule],
  controllers: [HealthController, DemoController],
  providers: [
    // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // Global Interceptors (executed in order)
    {
      provide: APP_INTERCEPTOR,
      useClass: CorrelationIdInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    // Global Guards (executed in order)
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantContextGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AppModule {}
