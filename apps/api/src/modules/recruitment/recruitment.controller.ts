import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Public } from "../../common/decorators/require-permission.decorator.js";
import { RecruitmentService } from "./recruitment.service.js";
import type {
  JobOpeningDto,
  CreateJobOpeningDto,
  CandidateDto,
  CreateCandidateDto,
  UpdateCandidateStageDto,
  OnboardCandidateDto,
} from "./dto/recruitment.dto.js";

@ApiTags("Recruitment & ATS")
@ApiBearerAuth()
@Controller("api/v1/recruitment")
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  private resolveOrgId(req: { tenant?: { orgId?: string }; headers?: Record<string, string> }): string {
    return (
      req.tenant?.orgId ||
      (req.headers?.["x-org-id"] as string) ||
      "00000000-0000-0000-0000-000000000000"
    );
  }

  // ─── Job Requisitions ──────────────────────────────────────────────────────

  @Public()
  @Get("jobs")
  @ApiOperation({ summary: "Get all active job openings and vacancies" })
  getJobs(@Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> }): JobOpeningDto[] {
    const orgId = this.resolveOrgId(req);
    return this.recruitmentService.getJobs(orgId);
  }

  @Public()
  @Post("jobs")
  @ApiOperation({ summary: "Create a new job opening requisition" })
  createJob(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Body() dto: CreateJobOpeningDto,
  ): JobOpeningDto {
    const orgId = this.resolveOrgId(req);
    return this.recruitmentService.createJob(orgId, dto);
  }

  // ─── Candidates (ATS) ──────────────────────────────────────────────────────

  @Public()
  @Get("candidates")
  @ApiOperation({ summary: "Get candidate applications by job or pipeline stage" })
  getCandidates(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Query("jobId") jobId?: string,
    @Query("stage") stage?: string,
  ): CandidateDto[] {
    const orgId = this.resolveOrgId(req);
    return this.recruitmentService.getCandidates(orgId, jobId, stage);
  }

  @Public()
  @Post("candidates")
  @ApiOperation({ summary: "Register a candidate job application" })
  createCandidate(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Body() dto: CreateCandidateDto,
  ): CandidateDto {
    const orgId = this.resolveOrgId(req);
    return this.recruitmentService.createCandidate(orgId, dto);
  }

  @Public()
  @Patch("candidates/:id/stage")
  @ApiOperation({ summary: "Advance candidate recruitment pipeline stage" })
  updateCandidateStage(
    @Param("id") id: string,
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Body() dto: UpdateCandidateStageDto,
  ): CandidateDto {
    const orgId = this.resolveOrgId(req);
    return this.recruitmentService.updateCandidateStage(orgId, id, dto);
  }

  @Public()
  @Post("candidates/:id/onboard")
  @ApiOperation({ summary: "Convert candidate to employee and trigger automated onboarding" })
  onboardCandidate(
    @Param("id") id: string,
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Body() dto: OnboardCandidateDto,
  ) {
    const orgId = this.resolveOrgId(req);
    return this.recruitmentService.onboardCandidate(orgId, id, dto);
  }

  @Public()
  @Get("stats")
  @ApiOperation({ summary: "Get recruitment and onboarding pipeline stats" })
  getStats(@Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> }) {
    const orgId = this.resolveOrgId(req);
    return this.recruitmentService.getStats(orgId);
  }
}
