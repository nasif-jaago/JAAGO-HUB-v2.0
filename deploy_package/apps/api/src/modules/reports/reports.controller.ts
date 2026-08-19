import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Inject,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Public } from "../../common/decorators/require-permission.decorator.js";
import { ReportsService } from "./reports.service.js";
import type {
  OperationalTaskDto,
  CreateTaskDto,
  UpdateTaskStatusDto,
  DocumentAttachmentDto,
  UploadDocumentDto,
  ExecutiveSummaryDto,
} from "./dto/reports.dto.js";

@ApiTags("Reports, Tasks & Document Hub")
@ApiBearerAuth()
@Controller("api/v1/reports")
export class ReportsController {
  constructor(@Inject(ReportsService) private readonly reportsService: ReportsService) {}

  // ─── Operational Tasks ─────────────────────────────────────────────────────

  @Public()
  @Get("tasks")
  @ApiOperation({ summary: "List operational tasks with origin and status filters" })
  getTasks(
    @Query("origin") origin?: string,
    @Query("status") status?: string,
  ): OperationalTaskDto[] {
    return this.reportsService.getTasks(origin, status);
  }

  @Public()
  @Post("tasks")
  @ApiOperation({ summary: "Create a new cross-module operational task" })
  createTask(@Body() dto: CreateTaskDto): OperationalTaskDto {
    return this.reportsService.createTask(dto);
  }

  @Public()
  @Patch("tasks/:id/status")
  @ApiOperation({ summary: "Update task completion status" })
  updateTaskStatus(
    @Param("id") id: string,
    @Body() dto: UpdateTaskStatusDto,
  ): OperationalTaskDto {
    return this.reportsService.updateTaskStatus(id, dto);
  }

  // ─── Documents Repository ──────────────────────────────────────────────────

  @Public()
  @Get("documents")
  @ApiOperation({ summary: "List repository documents and attachments" })
  getDocuments(@Query("category") category?: string): DocumentAttachmentDto[] {
    return this.reportsService.getDocuments(category);
  }

  @Public()
  @Post("documents")
  @ApiOperation({ summary: "Register or upload a compliance document attachment" })
  uploadDocument(@Body() dto: UploadDocumentDto): DocumentAttachmentDto {
    return this.reportsService.uploadDocument(dto);
  }

  // ─── Executive Summary ─────────────────────────────────────────────────────

  @Public()
  @Get("executive-summary")
  @ApiOperation({ summary: "Get organization-wide executive BI metrics" })
  getExecutiveSummary(): ExecutiveSummaryDto {
    return this.reportsService.getExecutiveSummary();
  }
}
