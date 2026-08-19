import { Module } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER, Reflector } from "@nestjs/core";
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
import { AttendanceModule } from "./modules/attendance/attendance.module.js";
import { RecruitmentModule } from "./modules/recruitment/recruitment.module.js";
import { ProcurementModule } from "./modules/procurement/procurement.module.js";
import { InventoryModule } from "./modules/inventory/inventory.module.js";
import { FinanceModule } from "./modules/finance/finance.module.js";
import { AssetsModule } from "./modules/assets/assets.module.js";
import { SchoolsModule } from "./modules/schools/schools.module.js";
import { DonorsModule } from "./modules/donors/donors.module.js";
import { VendorsModule } from "./modules/vendors/vendors.module.js";
import { ReportsModule } from "./modules/reports/reports.module.js";
import { PeopleCultureModule } from "./modules/people-culture/people-culture.module.js";

@Module({
  imports: [
    AdminModule,
    ApiAuthModule,
    AuditModule,
    NotificationsModule,
    ApprovalsModule,
    HrModule,
    AttendanceModule,
    RecruitmentModule,
    ProcurementModule,
    InventoryModule,
    FinanceModule,
    AssetsModule,
    SchoolsModule,
    DonorsModule,
    VendorsModule,
    ReportsModule,
    PeopleCultureModule,
  ],
  controllers: [HealthController, DemoController],
  providers: [
    Reflector,
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
