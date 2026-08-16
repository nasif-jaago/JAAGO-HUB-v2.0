import { describe, it, expect, beforeEach } from "vitest";
import { DonorsService } from "../src/modules/donors/donors.service.js";
import { DonorsController } from "../src/modules/donors/donors.controller.js";

describe("Donors & Grant Management Module", () => {
  let donorsService: DonorsService;
  let donorsController: DonorsController;

  beforeEach(() => {
    donorsService = new DonorsService();
    donorsController = new DonorsController(donorsService);
  });

  it("lists all donors and calculates grant portfolio statistics", () => {
    const donors = donorsController.getDonors();
    expect(donors.length).toBeGreaterThanOrEqual(4);

    const stats = donorsController.getStats();
    expect(stats.totalGrantPortfolioBDT).toBeGreaterThan(0);
    expect(stats.totalDonors).toBeGreaterThanOrEqual(4);
    expect(stats.totalSponsoredChildren).toBeGreaterThan(0);
  });

  it("registers a new institutional partner donor", () => {
    const donor = donorsController.createDonor({
      name: "Global Education Development Trust UK",
      donorType: "INSTITUTIONAL_FOUNDATION",
      country: "United Kingdom",
      contactPerson: "Dr. Alistair Finch",
      email: "alistair.finch@gedt.org.uk",
      phone: "+44 20 8123 4567",
      totalPledgedBDT: 18000000,
    });

    expect(donor.name).toBe("Global Education Development Trust UK");
    expect(donor.totalPledgedBDT).toBe(18000000);
  });

  it("creates a multi-tranche institutional grant agreement", () => {
    const donor = donorsController.getDonors()[0]!;

    const grant = donorsController.createGrant({
      grantCode: "GRNT-FABER-2026-03",
      projectTitle: "Bandarban Indigenous Youth Literacy Programme",
      donorId: donor.id,
      totalAmountBDT: 8000000,
      currency: "BDT",
      startDate: "2026-04-01",
      endDate: "2027-03-31",
      targetSchoolBranch: "Bandarban Hill Tracts School",
      tranchesCount: 2,
    });

    expect(grant.grantCode).toBe("GRNT-FABER-2026-03");
    expect(grant.tranches.length).toBe(2);
    expect(grant.tranches[0]?.amountBDT).toBe(4000000);
    expect(grant.status).toBe("ACTIVE");
  });
});
