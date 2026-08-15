import { z } from "zod";
import { dateStringSchema, moneySchema } from "../common/index.js";

export const createExpenseSchema = z.object({
  expenseDate: dateStringSchema,
  description: z.string().min(5).max(500),
  totalAmount: moneySchema,
  budgetId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  lineItems: z
    .array(
      z.object({
        description: z.string().min(2).max(255),
        amount: moneySchema,
        category: z.string().max(100).optional(),
      }),
    )
    .optional(),
  notes: z.string().max(1000).optional(),
});

export const createBudgetSchema = z.object({
  name: z.string().min(2).max(200),
  fiscalYear: z.number().int().min(2020).max(2099),
  totalAmount: moneySchema,
  projectId: z.string().uuid().optional(),
  grantId: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
