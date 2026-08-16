import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Public } from "../../common/decorators/require-permission.decorator.js";
import { AttendanceService } from "./attendance.service.js";
import type {
  AttendanceRecordDto,
  AttendanceSettingsDto,
  BranchGeofenceConfig,
  ClockInDto,
  ClockOutDto,
} from "./dto/attendance.dto.js";

@ApiTags("Attendance & Geofence Engine")
@ApiBearerAuth()
@Controller("api/v1/attendance")
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  private resolveOrgId(req: { tenant?: { orgId?: string }; headers?: Record<string, string> }): string {
    return (
      req.tenant?.orgId ||
      (req.headers?.["x-org-id"] as string) ||
      "00000000-0000-0000-0000-000000000000"
    );
  }

  // ─── Attendance Records & Clock In/Out ──────────────────────────────────────

  @Public()
  @Get("records")
  @ApiOperation({ summary: "Get attendance history records" })
  getRecords(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Query("employeeId") employeeId?: string,
    @Query("date") date?: string,
    @Query("limit") limit?: number,
  ): { items: AttendanceRecordDto[]; total: number } {
    const orgId = this.resolveOrgId(req);
    return this.attendanceService.getAttendanceRecords(orgId, { employeeId, date, limit });
  }

  @Public()
  @Get("stats")
  @ApiOperation({ summary: "Get live today attendance breakdown" })
  getTodayStats(@Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> }) {
    const orgId = this.resolveOrgId(req);
    return this.attendanceService.getTodayStats(orgId);
  }

  @Public()
  @Post("clock-in")
  @ApiOperation({ summary: "Clock in with geofence coordinate verification or biometric sync" })
  clockIn(
    @Req() req: { tenant?: { orgId?: string }; user?: { id: string; displayName?: string }; headers?: Record<string, string> },
    @Body() dto: ClockInDto,
  ): AttendanceRecordDto {
    const orgId = this.resolveOrgId(req);
    const employee = {
      id: req.user?.id || "emp_1",
      fullName: req.user?.displayName || "Nasif Kamal",
      employeeCode: "EMP-1001",
      branchName: "Dhaka HQ (Banani)",
    };

    return this.attendanceService.clockIn(orgId, employee, dto);
  }

  @Public()
  @Post("clock-out")
  @ApiOperation({ summary: "Clock out and compute total hours worked" })
  clockOut(
    @Req() req: { tenant?: { orgId?: string }; user?: { id: string }; headers?: Record<string, string> },
    @Body() dto: ClockOutDto,
  ): AttendanceRecordDto {
    const orgId = this.resolveOrgId(req);
    const employeeId = req.user?.id || "emp_1";
    return this.attendanceService.clockOut(orgId, employeeId, dto);
  }

  // ─── Admin Geofence & Biometric Settings ────────────────────────────────────

  @Public()
  @Get("config")
  @ApiOperation({ summary: "Get branch geofence coordinates and biometric device configurations" })
  getSettings(): AttendanceSettingsDto {
    return this.attendanceService.getSettings();
  }

  @Public()
  @Put("config")
  @ApiOperation({ summary: "Update global attendance and geofencing policies" })
  updateSettings(@Body() dto: AttendanceSettingsDto): AttendanceSettingsDto {
    return this.attendanceService.updateSettings(dto);
  }

  @Public()
  @Post("config/branches")
  @ApiOperation({ summary: "Add new branch geofence boundary and biometric device" })
  addBranchGeofence(@Body() dto: Omit<BranchGeofenceConfig, "id">): BranchGeofenceConfig {
    return this.attendanceService.addBranchGeofence(dto);
  }

  @Public()
  @Put("config/branches/:id")
  @ApiOperation({ summary: "Update branch geofence boundary coordinates and device IP" })
  updateBranchGeofence(
    @Param("id") id: string,
    @Body() dto: Partial<BranchGeofenceConfig>,
  ): BranchGeofenceConfig {
    return this.attendanceService.updateBranchGeofence(id, dto);
  }
}
