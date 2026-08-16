import { describe, it, expect, beforeEach } from "vitest";
import { VendorsService } from "../src/modules/vendors/vendors.service.js";
import { VendorsController } from "../src/modules/vendors/vendors.controller.js";

describe("Vendor Portal & Compliance Module", () => {
  let vendorsService: VendorsService;
  let vendorsController: VendorsController;

  beforeEach(() => {
    vendorsService = new VendorsService();
    vendorsController = new VendorsController(vendorsService);
  });

  it("lists all onboarded vendors with stats", () => {
    const vendors = vendorsController.getVendors();
    expect(vendors.length).toBeGreaterThanOrEqual(4);

    const stats = vendorsController.getStats();
    expect(stats.totalVendors).toBeGreaterThanOrEqual(4);
    expect(stats.verifiedPercentage).toBeGreaterThan(0);
  });

  it("onboards a new vendor with automated VND- code", () => {
    const vendor = vendorsController.onboardVendor({
      companyName: "Meghna IT Solutions BD",
      category: "IT_HARDWARE_SOLAR",
      tradeLicenseNumber: "TRAD/DNCC/110948/2026",
      tinOrBinNumber: "TIN-551928374619",
      contactPerson: "Tanvir Ahmed",
      email: "tanvir@meghnait.com.bd",
      phone: "+8801719998877",
      bankAccountDetails: "Eastern Bank Ltd A/C: 115-104-9921",
    });

    expect(vendor.vendorCode).toMatch(/^VND-\d{4}-\d{4}$/);
    expect(vendor.complianceStatus).toBe("PENDING_REVIEW");
    expect(vendor.companyName).toBe("Meghna IT Solutions BD");
  });

  it("updates vendor compliance status and performance rating", () => {
    const vendors = vendorsController.getVendors();
    const targetVendor = vendors.find((v) => v.complianceStatus === "PENDING_REVIEW") || vendors[0]!;

    const updated = vendorsController.updateCompliance(targetVendor.id, {
      complianceStatus: "VERIFIED",
      ratingScore: 4.9,
      complianceRemarks: "Physical audit and tax documentation verified by Compliance Officer.",
    });

    expect(updated.complianceStatus).toBe("VERIFIED");
    expect(updated.ratingScore).toBe(4.9);
  });
});
