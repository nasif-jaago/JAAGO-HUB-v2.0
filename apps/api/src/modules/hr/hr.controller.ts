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
import { EmployeesService } from "./employees.service.js";
import { LeaveService } from "./leave.service.js";
import type {
  EmployeeDto,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  LeaveBalanceDto,
  LeaveApplicationDto,
  ApplyLeaveDto,
} from "./dto/hr.dto.js";

@ApiTags("Human Resources & Leave")
@ApiBearerAuth()
@Controller("api/v1/hr")
export class HrController {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly leaveService: LeaveService,
  ) {}

  private resolveOrgId(req: { tenant?: { orgId?: string }; headers?: Record<string, string> }): string {
    return (
      req.tenant?.orgId ||
      (req.headers?.["x-org-id"] as string) ||
      "00000000-0000-0000-0000-000000000000"
    );
  }

  // ─── Employees Directory ───────────────────────────────────────────────────

  @Public()
  @Get("employees")
  @ApiOperation({ summary: "Get employee master directory with search and filters" })
  getEmployees(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Query("search") search?: string,
    @Query("department") department?: string,
    @Query("office") office?: string,
    @Query("status") status?: string,
    @Query("limit") limit?: number,
  ): { items: EmployeeDto[]; total: number } {
    const orgId = this.resolveOrgId(req);
    return this.employeesService.getEmployees(orgId, { search, department, office, status, limit });
  }

  @Public()
  @Get("employees/stats")
  @ApiOperation({ summary: "Get employee headcount statistics" })
  getStats(@Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> }) {
    const orgId = this.resolveOrgId(req);
    return this.employeesService.getStats(orgId);
  }

  @Public()
  @Get("employees/:id")
  @ApiOperation({ summary: "Get employee full profile" })
  getEmployeeById(
    @Param("id") id: string,
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
  ): EmployeeDto {
    const orgId = this.resolveOrgId(req);
    return this.employeesService.getEmployeeById(orgId, id);
  }

  @Public()
  @Post("employees")
  @ApiOperation({ summary: "Enroll new employee" })
  createEmployee(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Body() dto: CreateEmployeeDto,
  ): EmployeeDto {
    const orgId = this.resolveOrgId(req);
    return this.employeesService.createEmployee(orgId, dto);
  }

  @Public()
  @Put("employees/:id")
  @ApiOperation({ summary: "Update employee details" })
  updateEmployee(
    @Param("id") id: string,
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Body() dto: UpdateEmployeeDto,
  ): EmployeeDto {
    const orgId = this.resolveOrgId(req);
    return this.employeesService.updateEmployee(orgId, id, dto);
  }

  // ─── Leave Management ──────────────────────────────────────────────────────

  @Public()
  @Get("leave/balances")
  @ApiOperation({ summary: "Get employee leave balances and quotas" })
  getLeaveBalances(
    @Req() req: { tenant?: { orgId?: string }; user?: { id: string }; headers?: Record<string, string> },
  ): LeaveBalanceDto[] {
    const orgId = this.resolveOrgId(req);
    const employeeId = req.user?.id || "emp_2";
    return this.leaveService.getBalances(orgId, employeeId);
  }

  @Public()
  @Get("leave/applications")
  @ApiOperation({ summary: "Get leave applications history" })
  getLeaveApplications(
    @Req() req: { tenant?: { orgId?: string }; user?: { id: string }; headers?: Record<string, string> },
    @Query("employeeId") employeeId?: string,
  ): LeaveApplicationDto[] {
    const orgId = this.resolveOrgId(req);
    return this.leaveService.getApplications(orgId, employeeId);
  }

  @Public()
  @Post("leave/applications")
  @ApiOperation({ summary: "Submit a new leave application" })
  applyForLeave(
    @Req() req: { tenant?: { orgId?: string }; user?: { id: string; displayName?: string; email?: string }; headers?: Record<string, string> },
    @Body() dto: ApplyLeaveDto,
  ): LeaveApplicationDto {
    const orgId = this.resolveOrgId(req);
    const employee = {
      id: req.user?.id || "emp_2",
      fullName: req.user?.displayName || "Salma Khatun",
      employeeCode: "EMP-1002",
      email: req.user?.email || "salma.khatun@jaago.com.bd",
    };

    return this.leaveService.applyForLeave(orgId, employee, dto);
  }
}
