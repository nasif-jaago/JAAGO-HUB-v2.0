export type VendorCategory =
  | "STATIONERY_BOOKS"
  | "IT_HARDWARE_SOLAR"
  | "CONSTRUCTION_MAINTENANCE"
  | "FOOD_NUTRITION"
  | "TRANSPORT_LOGISTICS"
  | "GENERAL_SERVICES";

export type ComplianceStatus = "VERIFIED" | "PENDING_REVIEW" | "REJECTED" | "BLACKLISTED";

export interface VendorProfileDto {
  id: string;
  vendorCode: string; // e.g. "VND-2026-0012"
  companyName: string;
  category: VendorCategory;
  tradeLicenseNumber: string;
  tinOrBinNumber: string;
  contactPerson: string;
  email: string;
  phone: string;
  bankAccountDetails: string;
  complianceStatus: ComplianceStatus;
  ratingScore: number; // 1.0 - 5.0
  totalOrdersFulfilled: number;
  onboardingDate: string;
  complianceRemarks?: string | undefined;
}

export interface OnboardVendorDto {
  companyName: string;
  category: VendorCategory;
  tradeLicenseNumber: string;
  tinOrBinNumber: string;
  contactPerson: string;
  email: string;
  phone: string;
  bankAccountDetails: string;
}

export interface UpdateVendorComplianceDto {
  complianceStatus: ComplianceStatus;
  ratingScore?: number | undefined;
  complianceRemarks?: string | undefined;
}

export interface VendorStatsDto {
  totalVendors: number;
  verifiedPercentage: number;
  activeRfqs: number;
  blacklistedCount: number;
}
