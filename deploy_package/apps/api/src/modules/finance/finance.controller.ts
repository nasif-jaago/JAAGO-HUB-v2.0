import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  Inject,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Public } from "../../common/decorators/require-permission.decorator.js";
import { FinanceService } from "./finance.service.js";
import type {
  AccountDto,
  CreateAccountDto,
  VoucherDto,
  CreateVoucherDto,
  FinanceStatsDto,
} from "./dto/finance.dto.js";

@ApiTags("Finance & General Ledger")
@ApiBearerAuth()
@Controller("api/v1/finance")
export class FinanceController {
  constructor(@Inject(FinanceService) private readonly financeService: FinanceService) {}

  private resolveOrgId(req: { tenant?: { orgId?: string }; headers?: Record<string, string> }): string {
    return (
      req.tenant?.orgId ||
      (req.headers?.["x-org-id"] as string) ||
      "00000000-0000-0000-0000-000000000000"
    );
  }

  // ─── Chart of Accounts ─────────────────────────────────────────────────────

  @Public()
  @Get("accounts")
  @ApiOperation({ summary: "Get Chart of Accounts with balance and class filter" })
  getChartOfAccounts(@Query("class") accountClass?: string): AccountDto[] {
    return this.financeService.getChartOfAccounts(accountClass);
  }

  @Public()
  @Post("accounts")
  @ApiOperation({ summary: "Create new account in Chart of Accounts" })
  createAccount(@Body() dto: CreateAccountDto): AccountDto {
    return this.financeService.createAccount(dto);
  }

  // ─── Vouchers ──────────────────────────────────────────────────────────────

  @Public()
  @Get("vouchers")
  @ApiOperation({ summary: "List double-entry financial vouchers (JV, PV, RV)" })
  getVouchers(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string> },
    @Query("type") type?: string,
  ): VoucherDto[] {
    const orgId = this.resolveOrgId(req);
    return this.financeService.getVouchers(orgId, type);
  }

  @Public()
  @Post("vouchers")
  @ApiOperation({ summary: "Create and post balanced double-entry voucher" })
  createVoucher(
    @Req() req: { tenant?: { orgId?: string }; headers?: Record<string, string>; user?: { name?: string } },
    @Body() dto: CreateVoucherDto,
  ): VoucherDto {
    const orgId = this.resolveOrgId(req);
    const createdBy = req.user?.name || "Senior Accountant";
    return this.financeService.createVoucher(orgId, createdBy, dto);
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────

  @Public()
  @Get("stats")
  @ApiOperation({ summary: "Get financial health, balances and voucher stats" })
  getStats(): FinanceStatsDto {
    return this.financeService.getStats();
  }
}
