import type { ExpenseStatus, PaymentStatus } from "../enums/index.js";
import type { Money } from "../common/index.js";

export interface Budget {
  id: string;
  orgId: string;
  name: string;
  projectId: string | null;
  grantId: string | null;
  fiscalYear: number;
  totalAmount: Money;
  approvedAmount: Money;
  committedAmount: Money;  // POs approved but not yet paid
  spentAmount: Money;
  availableAmount: Money;  // = approved - committed - spent (server-computed)
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  orgId: string;
  referenceNumber: string;
  employeeId: string;
  budgetId: string | null;
  projectId: string | null;
  status: ExpenseStatus;
  totalAmount: Money;
  approvalRequestId: string | null;
  expenseDate: string;
  description: string;
  receiptUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  orgId: string;
  referenceNumber: string;
  vendorId: string | null;
  employeeId: string | null;
  purchaseOrderId: string | null;
  expenseId: string | null;
  status: PaymentStatus;
  amount: Money;
  paymentDate: string | null;
  paymentMethod: string | null;
  notes: string | null;
  approvalRequestId: string | null;
  createdAt: string;
  updatedAt: string;
}
