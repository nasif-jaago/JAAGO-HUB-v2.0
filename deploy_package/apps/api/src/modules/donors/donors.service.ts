import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { getLogger } from "@jaago/logger";
import type {
  DonorDto,
  CreateDonorDto,
  GrantDto,
  CreateGrantDto,
  GrantTrancheDto,
  DonorStatsDto,
} from "./dto/donors.dto.js";

@Injectable()
export class DonorsService {
  private readonly donors: DonorDto[] = [];
  private readonly grants: GrantDto[] = [];

  constructor() {
    this.seedDefaultDonorsData();
  }

  private safeLog(meta: Record<string, unknown>, message: string): void {
    try {
      getLogger().info(meta, message);
    } catch {
      // Logger uninitialized in tests
    }
  }

  private seedDefaultDonorsData(): void {
    // Default Donors
    this.donors.push(
      {
        id: "dnr_1",
        name: "Faber Foundation Australia",
        donorType: "INSTITUTIONAL_FOUNDATION",
        country: "Australia",
        contactPerson: "Sarah Jenkins (Grants Lead)",
        email: "sarah.jenkins@faberfoundation.org.au",
        phone: "+61 2 9876 5432",
        totalPledgedBDT: 15000000,
        activeGrantsCount: 1,
        sponsoredChildrenCount: 45,
      },
      {
        id: "dnr_2",
        name: "Standard Chartered Community Trust",
        donorType: "CORPORATE_CSR",
        country: "United Kingdom",
        contactPerson: "Marcus Vance",
        email: "marcus.vance@sc.com",
        phone: "+44 20 7946 0192",
        totalPledgedBDT: 22000000,
        activeGrantsCount: 1,
        sponsoredChildrenCount: 80,
      },
      {
        id: "dnr_3",
        name: "UNICEF Education Bangladesh",
        donorType: "GOVERNMENT_AID",
        country: "Bangladesh",
        contactPerson: "Dr. Kazi Mahfuzur Rahman",
        email: "kazi.rahman@unicef.org",
        phone: "+880 2 5566 7788",
        totalPledgedBDT: 35000000,
        activeGrantsCount: 1,
        sponsoredChildrenCount: 120,
      },
      {
        id: "dnr_4",
        name: "Dr. David Sterling",
        donorType: "INDIVIDUAL_SPONSOR",
        country: "United Kingdom",
        contactPerson: "Dr. David Sterling",
        email: "david.sterling@oxon.org.uk",
        phone: "+44 7700 900123",
        totalPledgedBDT: 720000,
        activeGrantsCount: 0,
        sponsoredChildrenCount: 3,
      },
    );

    // Default Grants & Tranches
    this.grants.push(
      {
        id: "grnt_1",
        grantCode: "GRNT-UNICEF-2026-01",
        projectTitle: "Digital Classroom & ICT Literacy Scale-up in Coastal Schools",
        donorId: "dnr_3",
        donorName: "UNICEF Education Bangladesh",
        totalAmountBDT: 35000000,
        disbursedAmountBDT: 17500000,
        utilizedAmountBDT: 12400000,
        currency: "BDT",
        startDate: "2026-01-01",
        endDate: "2027-12-31",
        targetSchoolBranch: "Chittagong Coastal & Bandarban Schools",
        status: "ACTIVE",
        tranches: [
          {
            id: "trn_1",
            trancheNumber: 1,
            expectedDate: "2026-01-15",
            disbursedDate: "2026-01-18",
            amountBDT: 17500000,
            status: "DISBURSED",
            remarks: "Initial procurement tranche for 6 digital studio labs",
          },
          {
            id: "trn_2",
            trancheNumber: 2,
            expectedDate: "2026-09-01",
            amountBDT: 17500000,
            status: "SCHEDULED",
            remarks: "Mid-term operational and academic delivery milestone",
          },
        ],
      },
      {
        id: "grnt_2",
        grantCode: "GRNT-FABER-2026-02",
        projectTitle: "Solar Science Labs & Elementary Robotics Curriculum",
        donorId: "dnr_1",
        donorName: "Faber Foundation Australia",
        totalAmountBDT: 15000000,
        disbursedAmountBDT: 7500000,
        utilizedAmountBDT: 5800000,
        currency: "BDT",
        startDate: "2026-03-01",
        endDate: "2027-02-28",
        targetSchoolBranch: "Rajshahi & Habiganj Schools",
        status: "ACTIVE",
        tranches: [
          {
            id: "trn_3",
            trancheNumber: 1,
            expectedDate: "2026-03-10",
            disbursedDate: "2026-03-12",
            amountBDT: 7500000,
            status: "DISBURSED",
            remarks: "Solar equipment installation and optics apparatus",
          },
          {
            id: "trn_4",
            trancheNumber: 2,
            expectedDate: "2026-10-01",
            amountBDT: 7500000,
            status: "SCHEDULED",
            remarks: "Teacher training and inter-school science fair",
          },
        ],
      },
    );
  }

  // ─── Donors ────────────────────────────────────────────────────────────────

  getDonors(type?: string): DonorDto[] {
    return this.donors
      .filter((d) => (!type || type === "ALL" ? true : d.donorType === type))
      .sort((a, b) => b.totalPledgedBDT - a.totalPledgedBDT);
  }

  createDonor(dto: CreateDonorDto): DonorDto {
    const existing = this.donors.find((d) => d.email.toLowerCase() === dto.email.toLowerCase());
    if (existing) {
      throw new BadRequestException(`Donor with email ${dto.email} already registered.`);
    }

    const donor: DonorDto = {
      id: `dnr_${Date.now().toString(36)}`,
      name: dto.name,
      donorType: dto.donorType,
      country: dto.country,
      contactPerson: dto.contactPerson,
      email: dto.email,
      phone: dto.phone,
      totalPledgedBDT: dto.totalPledgedBDT || 0,
      activeGrantsCount: 0,
      sponsoredChildrenCount: 0,
    };

    this.donors.push(donor);
    this.safeLog({ name: donor.name, country: donor.country }, `Added Donor Profile ${donor.name}`);
    return donor;
  }

  // ─── Grants ────────────────────────────────────────────────────────────────

  getGrants(donorId?: string): GrantDto[] {
    return this.grants
      .filter((g) => (!donorId || donorId === "ALL" ? true : g.donorId === donorId))
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }

  createGrant(dto: CreateGrantDto): GrantDto {
    const donor = this.donors.find((d) => d.id === dto.donorId);
    if (!donor) {
      throw new NotFoundException(`Donor ID ${dto.donorId} not found.`);
    }

    const existing = this.grants.find((g) => g.grantCode.toLowerCase() === dto.grantCode.toLowerCase());
    if (existing) {
      throw new BadRequestException(`Grant code ${dto.grantCode} already exists.`);
    }

    const tranchesCount = dto.tranchesCount || 2;
    const trancheAmount = Math.round(dto.totalAmountBDT / tranchesCount);
    const tranches: GrantTrancheDto[] = [];

    for (let i = 1; i <= tranchesCount; i++) {
      tranches.push({
        id: `trn_${Date.now().toString(36)}_${i}`,
        trancheNumber: i,
        expectedDate: i === 1 ? dto.startDate : dto.endDate,
        amountBDT: trancheAmount,
        status: "SCHEDULED",
        remarks: `Milestone Tranche #${i} disbursement`,
      });
    }

    const grant: GrantDto = {
      id: `grnt_${Date.now().toString(36)}`,
      grantCode: dto.grantCode.toUpperCase(),
      projectTitle: dto.projectTitle,
      donorId: donor.id,
      donorName: donor.name,
      totalAmountBDT: dto.totalAmountBDT,
      disbursedAmountBDT: 0,
      utilizedAmountBDT: 0,
      currency: dto.currency || "BDT",
      startDate: dto.startDate,
      endDate: dto.endDate,
      targetSchoolBranch: dto.targetSchoolBranch,
      status: "ACTIVE",
      tranches,
    };

    donor.activeGrantsCount += 1;
    donor.totalPledgedBDT += dto.totalAmountBDT;

    this.grants.unshift(grant);
    this.safeLog(
      { grantCode: grant.grantCode, title: grant.projectTitle, amount: grant.totalAmountBDT },
      `Created Grant Agreement ${grant.grantCode}`,
    );

    return grant;
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────

  getStats(): DonorStatsDto {
    const totalPortfolio = this.grants.reduce((sum, g) => sum + g.totalAmountBDT, 0);
    const totalSponsored = this.donors.reduce((sum, d) => sum + d.sponsoredChildrenCount, 0);
    const activeGrants = this.grants.filter((g) => g.status === "ACTIVE").length;

    return {
      totalGrantPortfolioBDT: totalPortfolio,
      totalDonors: this.donors.length,
      activeGrantsCount: activeGrants,
      totalSponsoredChildren: totalSponsored,
    };
  }
}
