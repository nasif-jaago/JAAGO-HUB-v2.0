import { z } from "zod";
import { dateStringSchema, moneySchema } from "../common/index.js";

export const createPurchaseRequestSchema = z.object({
  purpose: z.string().min(10).max(500),
  departmentId: z.string().uuid(),
  costCenterId: z.string().uuid().optional(),
  requiredBy: dateStringSchema.optional(),
  lineItems: z
    .array(
      z.object({
        description: z.string().min(2).max(255),
        quantity: z.coerce.number().positive(),
        unit: z.string().max(50).optional(),
        estimatedUnitCost: moneySchema.optional(),
      }),
    )
    .min(1, "At least one line item is required"),
  notes: z.string().max(1000).optional(),
});

export const purchaseRequestListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.string().optional(),
  status: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
  sort: z.enum(["createdAt", "referenceNumber", "requiredBy"]).default("createdAt"),
  dir: z.enum(["asc", "desc"]).default("desc"),
});

export const createVendorSchema = z.object({
  name: z.string().min(2).max(200),
  categoryId: z.string().uuid().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(20).optional(),
  taxId: z.string().max(50).optional(),
  address: z
    .object({
      line1: z.string().min(1).max(255),
      city: z.string().min(1).max(100),
      country: z.string().length(2).default("BD"),
    })
    .optional(),
  notes: z.string().max(1000).optional(),
});

export type CreatePurchaseRequestInput = z.infer<typeof createPurchaseRequestSchema>;
export type PurchaseRequestListQuery = z.infer<typeof purchaseRequestListQuerySchema>;
export type CreateVendorInput = z.infer<typeof createVendorSchema>;
