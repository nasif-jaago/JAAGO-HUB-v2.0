import { Controller, Get, Post, Put, Delete, Body, Query, Param, Inject } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Public } from "../../common/decorators/require-permission.decorator.js";
import { PeopleCultureService } from "./people-culture.service.js";
import type {
  OrganizationCompanyDto,
  DesignationDto,
  TeamDto,
  DepartmentDto,
  ProjectDto,
  InsuranceInfoDto,
  EmployeeDto,
  PCDashboardStatsDto,
  LeaveRequestDto,
  AttendanceLogDto,
  AppraisalDto,
  PayrollEntryDto,
  HRRequestDto,
  AnnouncementDto,
} from "./dto/people-culture.dto.js";

@ApiTags("People & Culture")
@Controller("api/v1/people-culture")
export class PeopleCultureController {
  constructor(@Inject(PeopleCultureService) private readonly pcService: PeopleCultureService) {}

  @Public()
  @Get("dashboard")
  @ApiOperation({ summary: "Get People & Culture real-time intelligence dashboard stats" })
  async getDashboardStats(@Query("org") org?: string): Promise<PCDashboardStatsDto> {
    return await this.pcService.getDashboardStats(org || "ALL");
  }

  @Public()
  @Get("companies")
  @ApiOperation({ summary: "Get list of registered organization entities/companies" })
  async getCompanies(): Promise<OrganizationCompanyDto[]> {
    return await this.pcService.getCompanies();
  }

  @Public()
  @Get("designations")
  @ApiOperation({ summary: "Get list of designations" })
  async getDesignations(): Promise<DesignationDto[]> {
    return await this.pcService.getDesignations();
  }

  @Public()
  @Get("teams")
  @ApiOperation({ summary: "Get list of organizational teams" })
  async getTeams(): Promise<TeamDto[]> {
    return await this.pcService.getTeams();
  }

  @Public()
  @Get("departments")
  @ApiOperation({ summary: "Get list of departments" })
  async getDepartments(): Promise<DepartmentDto[]> {
    return await this.pcService.getDepartments();
  }

  @Public()
  @Get("projects")
  @ApiOperation({ summary: "Get list of projects" })
  async getProjects(): Promise<ProjectDto[]> {
    return await this.pcService.getProjects();
  }

  @Public()
  @Get("insurance")
  @ApiOperation({ summary: "Get list of group insurance policies" })
  async getInsurance(): Promise<InsuranceInfoDto[]> {
    return await this.pcService.getInsuranceInfo();
  }

  @Public()
  @Get("employees")
  @ApiOperation({ summary: "Get employee directory with entity and status filters" })
  async getEmployees(
    @Query("org") org?: string,
    @Query("status") status?: string,
  ): Promise<EmployeeDto[]> {
    return await this.pcService.getEmployees(org || "ALL", status || "ALL");
  }

  @Public()
  @Post("employees")
  @ApiOperation({ summary: "Create/Add a new employee and sync with Supabase" })
  async createEmployee(@Body() dto: Partial<EmployeeDto>): Promise<EmployeeDto> {
    return await this.pcService.createEmployee(dto);
  }

  @Public()
  @Put("employees/:id")
  @ApiOperation({ summary: "Update an employee record and sync with Supabase metadata" })
  async updateEmployee(@Param("id") id: string, @Body() dto: Partial<EmployeeDto>): Promise<EmployeeDto> {
    return await this.pcService.updateEmployee(id, dto);
  }

  @Public()
  @Delete("employees/:id")
  @ApiOperation({ summary: "Delete an employee and revoke access" })
  async deleteEmployee(@Param("id") id: string): Promise<{ success: boolean; message: string }> {
    return await this.pcService.deleteEmployee(id);
  }

  @Public()
  @Post("employees/bulk-delete")
  @ApiOperation({ summary: "Bulk delete multiple employees" })
  async bulkDeleteEmployees(@Body() body: { ids: string[] }): Promise<{ success: boolean; deletedCount: number; message: string }> {
    return await this.pcService.bulkDeleteEmployees(body.ids || []);
  }

  @Public()
  @Get("leave/requests")
  @ApiOperation({ summary: "Get list of leave requests" })
  async getLeaveRequests(): Promise<LeaveRequestDto[]> {
    return await this.pcService.getLeaveRequests();
  }

  @Public()
  @Get("attendance/logs")
  @ApiOperation({ summary: "Get list of attendance logs" })
  async getAttendanceLogs(): Promise<AttendanceLogDto[]> {
    return await this.pcService.getAttendanceLogs();
  }

  @Public()
  @Get("appraisals")
  @ApiOperation({ summary: "Get list of performance appraisals" })
  async getAppraisals(): Promise<AppraisalDto[]> {
    return await this.pcService.getAppraisals();
  }

  @Public()
  @Get("payroll")
  @ApiOperation({ summary: "Get payroll summary entries" })
  async getPayroll(): Promise<PayrollEntryDto[]> {
    return await this.pcService.getPayroll();
  }

  @Public()
  @Get("requests")
  @ApiOperation({ summary: "Get employee administrative requests" })
  async getRequests(): Promise<HRRequestDto[]> {
    return await this.pcService.getRequests();
  }

  @Public()
  @Get("announcements")
  @ApiOperation({ summary: "Get organizational announcements" })
  async getAnnouncements(): Promise<AnnouncementDto[]> {
    return await this.pcService.getAnnouncements();
  }
}
