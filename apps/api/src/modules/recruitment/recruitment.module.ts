import { Module } from "@nestjs/common";
import { RecruitmentController } from "./recruitment.controller.js";
import { RecruitmentService } from "./recruitment.service.js";
import { HrModule } from "../hr/hr.module.js";

@Module({
  imports: [HrModule],
  controllers: [RecruitmentController],
  providers: [RecruitmentService],
  exports: [RecruitmentService],
})
export class RecruitmentModule {}
