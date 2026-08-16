export type AccountClass = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
export type NormalBalance = "DEBIT" | "CREDIT";
export type VoucherType = "JOURNAL_VOUCHER" | "PAYMENT_VOUCHER" | "RECEIPT_VOUCHER";
export type VoucherStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "POSTED" | "REJECTED";

export interface AccountDto {
  id: string;
  code: string; // e.g. "1010"
  name: string; // e.g. "Standard Chartered Operations Bank"
  accountClass: AccountClass;
  normalBalance: NormalBalance;
  parentCode?: string | undefined;
  currentBalanceBDT: number;
  isActive: boolean;
}

export interface CreateAccountDto {
  code: string;
  name: string;
  accountClass: AccountClass;
  normalBalance: NormalBalance;
  parentCode?: string | undefined;
  initialBalanceBDT?: number | undefined;
}

export interface VoucherLineItemDto {
  id: string;
  accountCode: string;
  accountName: string;
  description: string;
  debitBDT: number;
  creditBDT: number;
  costCenterOrBranch?: string | undefined;
}

export interface VoucherDto {
  id: string;
  orgId: string;
  voucherNumber: string; // e.g. "JV-2026-08-0045"
  type: VoucherType;
  voucherDate: string;
  payeeOrPayer?: string | undefined;
  narration: string;
  status: VoucherStatus;
  totalDebitBDT: number;
  totalCreditBDT: number;
  createdBy: string;
  approvedBy?: string | undefined;
  lines: VoucherLineItemDto[];
}

export interface CreateVoucherDto {
  type: VoucherType;
  voucherDate?: string | undefined;
  payeeOrPayer?: string | undefined;
  narration: string;
  lines: Array<{
    accountCode: string;
    description: string;
    debitBDT: number;
    creditBDT: number;
    costCenterOrBranch?: string | undefined;
  }>;
}

export interface FinanceStatsDto {
  totalAccounts: number;
  totalAssetBalanceBDT: number;
  totalExpenseThisMonthBDT: number;
  pendingVoucherApprovals: number;
}
