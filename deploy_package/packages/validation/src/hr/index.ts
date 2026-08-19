import { z } from "zod";
import { dateStringSchema, dateRangeSchema, emailSchema, phoneSchema } from "../common/index.js";
import { EmploymentType, Gender } from "@jaago/shared-types";

export const createEmployeeSchema = z.object({
  // Personal
  fullName: z.string().min(2).max(100),
  banglaName: z.string().max(100).optional(),
  dateOfBirth: dateStringSchema.optional(),
  gender: z.nativeEnum(Gender).optional(),
  personalEmail: emailSchema.optional(),
  phone: phoneSchema,

  // Employment
  departmentId: z.string().uuid(),
  officeId: z.string().uuid(),
  designationId: z.string().uuid(),
  reportsToEmployeeId: z.string().uuid().optional(),
  employmentType: z.nativeEnum(EmploymentType),
  joinDate: dateStringSchema,

  // Optional invite
  sendInvite: z.boolean().default(false),
  inviteEmail: emailSchema.optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().omit({ sendInvite: true, inviteEmail: true });

export const employeeListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.string().optional(),
  sort: z.enum(["fullName", "employeeCode", "joinDate", "createdAt"]).default("fullName"),
  dir: z.enum(["asc", "desc"]).default("asc"),
  departmentId: z.string().uuid().optional(),
  officeId: z.string().uuid().optional(),
  status: z.string().optional(),
  search: z.string().max(100).optional(),
});

export const createLeaveRequestSchema = z
  .object({
    leaveTypeId: z.string().uuid(),
    fromDate: dateStringSchema,
    toDate: dateStringSchema,
    reason: z.string().max(500).optional(),
  })
  .refine((d) => d.fromDate <= d.toDate, {
    message: "From date must be before or equal to To date",
    path: ["fromDate"],
  });

export const leaveRequestListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.string().optional(),
  status: z.string().optional(),
  employeeId: z.string().uuid().optional(),
  dateRange: dateRangeSchema.optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type EmployeeListQuery = z.infer<typeof employeeListQuerySchema>;
export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>;
export type LeaveRequestListQuery = z.infer<typeof leaveRequestListQuerySchema>;
