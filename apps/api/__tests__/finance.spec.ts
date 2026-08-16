import { describe, it, expect, beforeEach } from "vitest";
import { FinanceService } from "../src/modules/finance/finance.service.js";
import { FinanceController } from "../src/modules/finance/finance.controller.js";

describe("Finance & General Ledger Module", () => {
  let financeService: FinanceService;
  let financeController: FinanceController;
  const mockOrgId = "00000000-0000-0000-0000-000000000000";
  const mockReq = {
    tenant: { orgId: mockOrgId },
    headers: {},
    user: { name: "Senior Accountant" },
  };

  beforeEach(() => {
    financeService = new FinanceService();
    financeController = new FinanceController(financeService);
  });

  it("lists default Chart of Accounts and calculates total balance stats", () => {
    const accounts = financeController.getChartOfAccounts();
    expect(accounts.length).toBeGreaterThanOrEqual(10);

    const stats = financeController.getStats();
    expect(stats.totalAccounts).toBeGreaterThanOrEqual(10);
    expect(stats.totalAssetBalanceBDT).toBeGreaterThan(0);
  });

  it("creates a new general ledger account", () => {
    const acc = financeController.createAccount({
      code: "1030",
      name: "Dutch-Bangla Bank (Mobile Banking)",
      accountClass: "ASSET",
      normalBalance: "DEBIT",
      initialBalanceBDT: 50000,
    });

    expect(acc.code).toBe("1030");
    expect(acc.name).toBe("Dutch-Bangla Bank (Mobile Banking)");
    expect(acc.currentBalanceBDT).toBe(50000);
  });

  it("creates a balanced double-entry payment voucher (PV) and updates account balances", () => {
    const initialBank = financeService.getChartOfAccounts().find((a) => a.code === "1010")?.currentBalanceBDT || 0;
    const initialExpense = financeService.getChartOfAccounts().find((a) => a.code === "5030")?.currentBalanceBDT || 0;

    const voucher = financeController.createVoucher(mockReq, {
      type: "PAYMENT_VOUCHER",
      payeeOrPayer: "DESCO Electricity Dhaka",
      narration: "Electricity bill settlement for HQ office",
      lines: [
        {
          accountCode: "5030",
          description: "August Electricity Bill",
          debitBDT: 25000,
          creditBDT: 0,
        },
        {
          accountCode: "1010",
          description: "EFT Bank Settlement",
          debitBDT: 0,
          creditBDT: 25000,
        },
      ],
    });

    expect(voucher.voucherNumber).toMatch(/^PV-\d{4}-\d{2}-\d{4}$/);
    expect(voucher.totalDebitBDT).toBe(25000);
    expect(voucher.totalCreditBDT).toBe(25000);

    // Verify account balances changed: Bank decreased by 25000, Expense increased by 25000
    const finalBank = financeService.getChartOfAccounts().find((a) => a.code === "1010")?.currentBalanceBDT;
    const finalExpense = financeService.getChartOfAccounts().find((a) => a.code === "5030")?.currentBalanceBDT;

    expect(finalBank).toBe(initialBank - 25000);
    expect(finalExpense).toBe(initialExpense + 25000);
  });

  it("strictly rejects unbalanced vouchers where sum(Debit) != sum(Credit)", () => {
    expect(() =>
      financeController.createVoucher(mockReq, {
        type: "JOURNAL_VOUCHER",
        narration: "Unbalanced adjustment test",
        lines: [
          {
            accountCode: "5010",
            description: "Salary expense",
            debitBDT: 50000,
            creditBDT: 0,
          },
          {
            accountCode: "1010",
            description: "Bank transfer",
            debitBDT: 0,
            creditBDT: 40000, // Unbalanced by 10,000!
          },
        ],
      }),
    ).toThrowError(/Voucher is unbalanced/);
  });
});
