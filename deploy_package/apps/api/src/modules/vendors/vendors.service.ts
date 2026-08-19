import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { getLogger } from "@jaago/logger";
import type {
  VendorProfileDto,
  OnboardVendorDto,
  UpdateVendorComplianceDto,
  VendorStatsDto,
} from "./dto/vendors.dto.js";

@Injectable()
export class VendorsService {
  private readonly vendors: VendorProfileDto[] = [];
  private sequenceCounter = 12;

  constructor() {
    this.seedDefaultVendorsData();
  }

  private safeLog(meta: Record<string, unknown>, message: string): void {
    try {
      getLogger().info(meta, message);
    } catch {
      // Logger uninitialized in tests
    }
  }

  private seedDefaultVendorsData(): void {
    this.vendors.push(
      {
        id: "vnd_1",
        vendorCode: "VND-2026-0001",
        companyName: "Bengal Paper & Stationery Mart",
        category: "STATIONERY_BOOKS",
        tradeLicenseNumber: "TRAD/DSCC/012948/2024",
        tinOrBinNumber: "TIN-889124019283",
        contactPerson: "Khorshed Alam",
        email: "khorshed@bengalpaper.com.bd",
        phone: "+8801711002233",
        bankAccountDetails: "Dutch-Bangla Bank A/C: 104-120-9948",
        complianceStatus: "VERIFIED",
        ratingScore: 4.8,
        totalOrdersFulfilled: 18,
        onboardingDate: "2024-03-15",
        complianceRemarks: "Fully audited Trade License and 2026 Tax Return Certificate verified.",
      },
      {
        id: "vnd_2",
        vendorCode: "VND-2026-0002",
        companyName: "Dhaka Scientific Instruments Ltd.",
        category: "IT_HARDWARE_SOLAR",
        tradeLicenseNumber: "TRAD/DNCC/084920/2025",
        tinOrBinNumber: "TIN-771928401928",
        contactPerson: "Engr. Monirul Islam",
        email: "monirul@dhakascientific.com",
        phone: "+8801819223344",
        bankAccountDetails: "BRAC Bank A/C: 150-102-8821",
        complianceStatus: "VERIFIED",
        ratingScore: 4.9,
        totalOrdersFulfilled: 12,
        onboardingDate: "2024-06-20",
        complianceRemarks: "Authorized supplier for optical microscopes and STEM robotics kits.",
      },
      {
        id: "vnd_3",
        vendorCode: "VND-2026-0003",
        companyName: "Sundarban Courier & Logistics Services",
        category: "TRANSPORT_LOGISTICS",
        tradeLicenseNumber: "TRAD/DSCC/092841/2023",
        tinOrBinNumber: "TIN-991823746152",
        contactPerson: "Anwar Hossain",
        email: "corporate@sundarbancourier.com",
        phone: "+8801912334455",
        bankAccountDetails: "Islami Bank A/C: 205-010-4491",
        complianceStatus: "VERIFIED",
        ratingScore: 4.6,
        totalOrdersFulfilled: 34,
        onboardingDate: "2023-08-10",
        complianceRemarks: "Contracted logistics provider for remote branch shipments.",
      },
      {
        id: "vnd_4",
        vendorCode: "VND-2026-0004",
        companyName: "Delta Quality Printers & Binders",
        category: "STATIONERY_BOOKS",
        tradeLicenseNumber: "TRAD/DNCC/102948/2024",
        tinOrBinNumber: "TIN-662819304918",
        contactPerson: "Kamal Uddin",
        email: "kamal@deltaprinters.com",
        phone: "+8801611223344",
        bankAccountDetails: "City Bank A/C: 110-293-8471",
        complianceStatus: "PENDING_REVIEW",
        ratingScore: 3.8,
        totalOrdersFulfilled: 4,
        onboardingDate: "2026-07-28",
        complianceRemarks: "Awaiting updated 2026 TIN renewal document upload.",
      },
    );
  }

  // ─── Vendor Directory ──────────────────────────────────────────────────────

  getVendors(category?: string, status?: string): VendorProfileDto[] {
    return this.vendors.filter((v) => {
      if (category && category !== "ALL" && v.category !== category) return false;
      if (status && status !== "ALL" && v.complianceStatus !== status) return false;
      return true;
    });
  }

  onboardVendor(dto: OnboardVendorDto): VendorProfileDto {
    const existing = this.vendors.find(
      (v) =>
        v.email.toLowerCase() === dto.email.toLowerCase() ||
        v.tinOrBinNumber.toLowerCase() === dto.tinOrBinNumber.toLowerCase(),
    );

    if (existing) {
      throw new BadRequestException("Vendor with this email or TIN/BIN is already registered.");
    }

    this.sequenceCounter += 1;
    const year = new Date().getFullYear();
    const vendorCode = `VND-${year}-${this.sequenceCounter.toString().padStart(4, "0")}`;

    const vendor: VendorProfileDto = {
      id: `vnd_${Date.now().toString(36)}`,
      vendorCode,
      companyName: dto.companyName,
      category: dto.category,
      tradeLicenseNumber: dto.tradeLicenseNumber,
      tinOrBinNumber: dto.tinOrBinNumber,
      contactPerson: dto.contactPerson,
      email: dto.email,
      phone: dto.phone,
      bankAccountDetails: dto.bankAccountDetails,
      complianceStatus: "PENDING_REVIEW",
      ratingScore: 5.0,
      totalOrdersFulfilled: 0,
      onboardingDate: new Date().toISOString().split("T")[0]!,
      complianceRemarks: "Initial self-onboarding submitted. Pending compliance audit.",
    };

    this.vendors.unshift(vendor);
    this.safeLog(
      { vendorCode, company: vendor.companyName, category: vendor.category },
      `Onboarded Vendor ${vendor.companyName} (${vendorCode})`,
    );

    return vendor;
  }

  updateCompliance(id: string, dto: UpdateVendorComplianceDto): VendorProfileDto {
    const vendor = this.vendors.find((v) => v.id === id);
    if (!vendor) {
      throw new NotFoundException(`Vendor ID ${id} not found.`);
    }

    vendor.complianceStatus = dto.complianceStatus;
    if (dto.ratingScore !== undefined) vendor.ratingScore = dto.ratingScore;
    if (dto.complianceRemarks !== undefined) vendor.complianceRemarks = dto.complianceRemarks;

    this.safeLog(
      { vendorCode: vendor.vendorCode, status: vendor.complianceStatus, rating: vendor.ratingScore },
      `Updated compliance for ${vendor.companyName}: ${vendor.complianceStatus}`,
    );

    return vendor;
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────

  getStats(): VendorStatsDto {
    const total = this.vendors.length;
    const verifiedCount = this.vendors.filter((v) => v.complianceStatus === "VERIFIED").length;
    const verifiedPct = total > 0 ? Math.round((verifiedCount / total) * 100) : 100;
    const blacklisted = this.vendors.filter((v) => v.complianceStatus === "BLACKLISTED").length;

    return {
      totalVendors: total,
      verifiedPercentage: verifiedPct,
      activeRfqs: 3,
      blacklistedCount: blacklisted,
    };
  }
}
