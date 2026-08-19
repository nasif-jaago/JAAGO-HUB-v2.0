import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { getLogger } from "@jaago/logger";
import { generateReferenceNumber } from "@jaago/integrations";
import type {
  AccountDto,
  CreateAccountDto,
  VoucherDto,
  CreateVoucherDto,
  FinanceStatsDto,
} from "./dto/finance.dto.js";

@Injectable()
export class FinanceService {
  private readonly accounts: AccountDto[] = [];
  private readonly vouchers: VoucherDto[] = [];
  private jvSequence = 45;
  private pvSequence = 22;
  private rvSequence = 18;

  constructor() {
    this.seedDefaultFinanceData();
  }

  private safeLog(meta: Record<string, unknown>, message: string): void {
    try {
      getLogger().info(meta, message);
    } catch {
      // Logger uninitialized in tests
    }
  }

  private seedDefaultFinanceData(): void {
    this.accounts.push(
      // Assets (1000 - 1999)
      {
        id: "acc_1",
        code: "1010",
        name: "Standard Chartered Bank (Operations)",
        accountClass: "ASSET",
        normalBalance: "DEBIT",
        currentBalanceBDT: 4850000,
        isActive: true,
      },
      {
        id: "acc_2",
        code: "1020",
        name: "BRAC Bank (Grants & Donor Fund)",
        accountClass: "ASSET",
        normalBalance: "DEBIT",
        currentBalanceBDT: 12500000,
        isActive: true,
      },
      {
        id: "acc_3",
        code: "1050",
        name: "Central Petty Cash (Dhaka HQ)",
        accountClass: "ASSET",
        normalBalance: "DEBIT",
        currentBalanceBDT: 120000,
        isActive: true,
      },
      // Liabilities (2000 - 2999)
      {
        id: "acc_4",
        code: "2010",
        name: "Accounts Payable (Vendors)",
        accountClass: "LIABILITY",
        normalBalance: "CREDIT",
        currentBalanceBDT: 450000,
        isActive: true,
      },
      // Equity & Restricted Reserves (3000 - 3999)
      {
        id: "acc_5",
        code: "3010",
        name: "General Operating Reserve Fund",
        accountClass: "EQUITY",
        normalBalance: "CREDIT",
        currentBalanceBDT: 16500000,
        isActive: true,
      },
      // Revenues (4000 - 4999)
      {
        id: "acc_6",
        code: "4010",
        name: "Institutional Grant Receipts",
        accountClass: "REVENUE",
        normalBalance: "CREDIT",
        currentBalanceBDT: 8500000,
        isActive: true,
      },
      {
        id: "acc_7",
        code: "4020",
        name: "Individual Child Sponsorship Donations",
        accountClass: "REVENUE",
        normalBalance: "CREDIT",
        currentBalanceBDT: 4200000,
        isActive: true,
      },
      // Expenses (5000 - 5999)
      {
        id: "acc_8",
        code: "5010",
        name: "Teacher & Academic Staff Salaries",
        accountClass: "EXPENSE",
        normalBalance: "DEBIT",
        currentBalanceBDT: 3450000,
        isActive: true,
      },
      {
        id: "acc_9",
        code: "5020",
        name: "School Science Lab & Learning Supplies",
        accountClass: "EXPENSE",
        normalBalance: "DEBIT",
        currentBalanceBDT: 890000,
        isActive: true,
      },
      {
        id: "acc_10",
        code: "5030",
        name: "Branch School Facility Utilities & Rent",
        accountClass: "EXPENSE",
        normalBalance: "DEBIT",
        currentBalanceBDT: 620000,
        isActive: true,
      },
    );

    // Initial Voucher
    this.vouchers.push({
      id: "vch_1",
      orgId: "00000000-0000-0000-0000-000000000000",
      voucherNumber: "PV-2026-08-0021",
      type: "PAYMENT_VOUCHER",
      voucherDate: "2026-08-14",
      payeeOrPayer: "Bengal Paper & Stationery Mart",
      narration: "Payment settlement for Grade-3 Textbooks and Learning Materials",
      status: "POSTED",
      totalDebitBDT: 60000,
      totalCreditBDT: 60000,
      createdBy: "Tanzimul Islam (Senior Accountant)",
      approvedBy: "Nusrat Jahan (Head of Finance)",
      lines: [
        {
          id: "vl_1",
          accountCode: "5020",
          accountName: "School Science Lab & Learning Supplies",
          description: "Grade-3 Textbooks Procurement",
          debitBDT: 60000,
          creditBDT: 0,
          costCenterOrBranch: "Rajshahi School",
        },
        {
          id: "vl_2",
          accountCode: "1010",
          accountName: "Standard Chartered Bank (Operations)",
          description: "Online EFT Transfer Settlement",
          debitBDT: 0,
          creditBDT: 60000,
          costCenterOrBranch: "Central HQ",
        },
      ],
    });
  }

  // ─── Chart of Accounts ─────────────────────────────────────────────────────

  getChartOfAccounts(accountClass?: string): AccountDto[] {
    return this.accounts
      .filter((a) => (!accountClass || accountClass === "ALL" ? true : a.accountClass === accountClass))
      .sort((a, b) => a.code.localeCompare(b.code));
  }

  createAccount(dto: CreateAccountDto): AccountDto {
    const existing = this.accounts.find((a) => a.code === dto.code);
    if (existing) {
      throw new BadRequestException(`Account with code ${dto.code} already exists.`);
    }

    const account: AccountDto = {
      id: `acc_${Date.now().toString(36)}`,
      code: dto.code,
      name: dto.name,
      accountClass: dto.accountClass,
      normalBalance: dto.normalBalance,
      parentCode: dto.parentCode,
      currentBalanceBDT: dto.initialBalanceBDT || 0,
      isActive: true,
    };

    this.accounts.push(account);
    this.safeLog({ code: account.code, name: account.name }, `Created Account ${account.code} - ${account.name}`);
    return account;
  }

  // ─── Double-Entry Vouchers ─────────────────────────────────────────────────

  getVouchers(orgId: string, type?: string): VoucherDto[] {
    return this.vouchers
      .filter((v) => v.orgId === orgId && (!type || type === "ALL" || v.type === type))
      .sort((a, b) => new Date(b.voucherDate).getTime() - new Date(a.voucherDate).getTime());
  }

  createVoucher(orgId: string, createdBy: string, dto: CreateVoucherDto): VoucherDto {
    if (!dto.lines || dto.lines.length < 2) {
      throw new BadRequestException("Double-entry voucher requires at least two line items (Debit and Credit).");
    }

    // Calculate total debit and total credit
    const totalDebit = dto.lines.reduce((sum, l) => sum + (l.debitBDT || 0), 0);
    const totalCredit = dto.lines.reduce((sum, l) => sum + (l.creditBDT || 0), 0);

    // Verify double-entry balance: sum(Debit) === sum(Credit)
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(
        `Voucher is unbalanced! Total Debit (BDT ${totalDebit.toLocaleString()}) must equal Total Credit (BDT ${totalCredit.toLocaleString()}). Difference: BDT ${Math.abs(totalDebit - totalCredit).toLocaleString()}`,
      );
    }

    if (totalDebit <= 0) {
      throw new BadRequestException("Voucher debit and credit amount must be greater than zero.");
    }

    // Generate sequential reference number
    let voucherNumber = "";
    if (dto.type === "PAYMENT_VOUCHER") {
      this.pvSequence += 1;
      voucherNumber = generateReferenceNumber({
        documentType: "PAYMENT_VOUCHER",
        sequence: this.pvSequence,
      });
    } else if (dto.type === "RECEIPT_VOUCHER") {
      this.rvSequence += 1;
      voucherNumber = generateReferenceNumber({
        documentType: "RECEIPT_VOUCHER",
        sequence: this.rvSequence,
      });
    } else {
      this.jvSequence += 1;
      voucherNumber = generateReferenceNumber({
        documentType: "JOURNAL_VOUCHER",
        sequence: this.jvSequence,
      });
    }

    const lines = dto.lines.map((l, idx) => {
      const account = this.accounts.find((a) => a.code === l.accountCode);
      if (!account) {
        throw new NotFoundException(`Account code ${l.accountCode} not found in Chart of Accounts.`);
      }

      return {
        id: `vl_${Date.now().toString(36)}_${idx}`,
        accountCode: l.accountCode,
        accountName: account.name,
        description: l.description,
        debitBDT: l.debitBDT || 0,
        creditBDT: l.creditBDT || 0,
        costCenterOrBranch: l.costCenterOrBranch,
      };
    });

    const voucher: VoucherDto = {
      id: `vch_${Date.now().toString(36)}`,
      orgId,
      voucherNumber,
      type: dto.type,
      voucherDate: dto.voucherDate || new Date().toISOString().split("T")[0]!,
      payeeOrPayer: dto.payeeOrPayer,
      narration: dto.narration,
      status: "POSTED", // Auto-posted for immediate ledger reflect
      totalDebitBDT: totalDebit,
      totalCreditBDT: totalCredit,
      createdBy,
      approvedBy: "Head of Finance",
      lines,
    };

    // Update account balances
    for (const line of lines) {
      const acc = this.accounts.find((a) => a.code === line.accountCode);
      if (acc) {
        if (acc.normalBalance === "DEBIT") {
          acc.currentBalanceBDT += line.debitBDT - line.creditBDT;
        } else {
          acc.currentBalanceBDT += line.creditBDT - line.debitBDT;
        }
      }
    }

    this.vouchers.unshift(voucher);
    this.safeLog(
      { orgId, voucherNumber, type: dto.type, amount: totalDebit },
      `Created & Posted Voucher ${voucherNumber} of BDT ${totalDebit.toLocaleString()}`,
    );

    return voucher;
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────

  getStats(): FinanceStatsDto {
    const totalAssets = this.accounts
      .filter((a) => a.accountClass === "ASSET")
      .reduce((sum, a) => sum + a.currentBalanceBDT, 0);

    const totalExpense = this.accounts
      .filter((a) => a.accountClass === "EXPENSE")
      .reduce((sum, a) => sum + a.currentBalanceBDT, 0);

    const pendingCount = this.vouchers.filter((v) => v.status === "SUBMITTED").length;

    return {
      totalAccounts: this.accounts.length,
      totalAssetBalanceBDT: totalAssets,
      totalExpenseThisMonthBDT: totalExpense,
      pendingVoucherApprovals: pendingCount,
    };
  }
}
