import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Inject,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Public } from "../../common/decorators/require-permission.decorator.js";
import { SchoolsService } from "./schools.service.js";
import type {
  SchoolBranchDto,
  CreateSchoolBranchDto,
  StudentDto,
  EnrollStudentDto,
  ClassroomSessionDto,
  CreateClassroomSessionDto,
  SchoolStatsDto,
} from "./dto/schools.dto.js";

@ApiTags("Field Programmes & School Operations")
@ApiBearerAuth()
@Controller("api/v1/schools")
export class SchoolsController {
  constructor(@Inject(SchoolsService) private readonly schoolsService: SchoolsService) {}

  // ─── Schools ───────────────────────────────────────────────────────────────

  @Public()
  @Get()
  @ApiOperation({ summary: "List all JAAGO branch schools and operational status" })
  getSchools(): SchoolBranchDto[] {
    return this.schoolsService.getSchools();
  }

  @Public()
  @Post()
  @ApiOperation({ summary: "Create a new branch school center" })
  createSchool(@Body() dto: CreateSchoolBranchDto): SchoolBranchDto {
    return this.schoolsService.createSchool(dto);
  }

  // ─── Students ──────────────────────────────────────────────────────────────

  @Public()
  @Get("students")
  @ApiOperation({ summary: "Get enrolled student roster with branch and grade filters" })
  getStudents(
    @Query("branch") branch?: string,
    @Query("grade") grade?: string,
  ): StudentDto[] {
    return this.schoolsService.getStudents(branch, grade);
  }

  @Public()
  @Post("students")
  @ApiOperation({ summary: "Enroll a new student and assign student ID" })
  enrollStudent(@Body() dto: EnrollStudentDto): StudentDto {
    return this.schoolsService.enrollStudent(dto);
  }

  // ─── Sessions ──────────────────────────────────────────────────────────────

  @Public()
  @Get("sessions")
  @ApiOperation({ summary: "List scheduled classroom and digital studio sessions" })
  getSessions(): ClassroomSessionDto[] {
    return this.schoolsService.getSessions();
  }

  @Public()
  @Post("sessions")
  @ApiOperation({ summary: "Schedule a classroom or digital studio session" })
  createSession(@Body() dto: CreateClassroomSessionDto): ClassroomSessionDto {
    return this.schoolsService.createSession(dto);
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────

  @Public()
  @Get("stats")
  @ApiOperation({ summary: "Get branch schools, student enrollment, and sponsorship stats" })
  getStats(): SchoolStatsDto {
    return this.schoolsService.getStats();
  }
}
