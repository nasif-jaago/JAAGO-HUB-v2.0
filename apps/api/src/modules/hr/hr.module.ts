import { Module } from "@nestjs/common";
import { HrController } from "./hr.controller.js";
import { EmployeesService } from "./employees.service.js";
import { LeaveService } from "./leave.service.js";
import { ApprovalsModule } from "../approvals/approvals.module.js";

@Module({
  imports: [ApprovalsModule],
  controllers: [HrController],
  providers: [EmployeesService, LeaveService],
  exports: [EmployeesService, LeaveService],
})
export class HrModule {}
