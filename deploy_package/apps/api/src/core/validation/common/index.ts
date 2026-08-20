import { z } from "zod";

// ─── Reusable primitives ──────────────────────────────────────────────────────

export const uuidSchema = z.string().uuid("Must be a valid UUID");

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.string().optional(),
  sort: z.string().optional(),
  dir: z.enum(["asc", "desc"]).default("desc"),
});

export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a valid date in YYYY-MM-DD format");

export const dateRangeSchema = z
  .object({
    from: dateStringSchema,
    to: dateStringSchema,
  })
  .refine((r) => r.from <= r.to, {
    message: "From date must be before or equal to To date",
    path: ["from"],
  });

/**
 * Money schema — amount as a decimal string to avoid IEEE 754 issues.
 * The backend will parse this into NUMERIC(15,4) for DB storage.
 */
export const moneySchema = z.object({
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,4})?$/, "Must be a positive decimal number with up to 4 decimal places"),
  currencyCode: z.string().length(3, "Must be a 3-letter ISO 4217 currency code").toUpperCase(),
});

export const phoneSchema = z
  .string()
  .regex(
    /^(\+8801|01)[3-9]\d{8}$/,
    "Must be a valid Bangladesh phone number (e.g. +8801712345678 or 01712345678)",
  )
  .optional()
  .or(z.literal(""));

export const emailSchema = z.string().email("Must be a valid email address").toLowerCase();

// ─── Address ──────────────────────────────────────────────────────────────────

export const addressSchema = z.object({
  line1: z.string().min(1).max(255),
  line2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  district: z.string().max(100).optional(),
  division: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().length(2, "Must be a 2-letter ISO 3166-1 alpha-2 country code").default("BD"),
});

// ─── Re-exports ───────────────────────────────────────────────────────────────

export { z } from "zod";
