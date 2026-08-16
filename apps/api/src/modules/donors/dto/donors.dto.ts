export type DonorType =
  | "INSTITUTIONAL_FOUNDATION"
  | "CORPORATE_CSR"
  | "GOVERNMENT_AID"
  | "INDIVIDUAL_SPONSOR";

export type GrantStatus = "PROPOSAL" | "ACTIVE" | "COMPLETED" | "CLOSED";
export type TrancheStatus = "SCHEDULED" | "DISBURSED" | "UTILIZED" | "AUDITED";

export interface DonorDto {
  id: string;
  name: string;
  donorType: DonorType;
  country: string;
  contactPerson: string;
  email: string;
  phone?: string | undefined;
  totalPledgedBDT: number;
  activeGrantsCount: number;
  sponsoredChildrenCount: number;
}

export interface CreateDonorDto {
  name: string;
  donorType: DonorType;
  country: string;
  contactPerson: string;
  email: string;
  phone?: string | undefined;
  totalPledgedBDT?: number | undefined;
}

export interface GrantTrancheDto {
  id: string;
  trancheNumber: number;
  expectedDate: string;
  disbursedDate?: string | undefined;
  amountBDT: number;
  status: TrancheStatus;
  remarks?: string | undefined;
}

export interface GrantDto {
  id: string;
  grantCode: string; // e.g. "GRNT-UNICEF-2026-01"
  projectTitle: string;
  donorId: string;
  donorName: string;
  totalAmountBDT: number;
  disbursedAmountBDT: number;
  utilizedAmountBDT: number;
  currency: string;
  startDate: string;
  endDate: string;
  targetSchoolBranch: string;
  status: GrantStatus;
  tranches: GrantTrancheDto[];
}

export interface CreateGrantDto {
  grantCode: string;
  projectTitle: string;
  donorId: string;
  totalAmountBDT: number;
  currency?: string | undefined;
  startDate: string;
  endDate: string;
  targetSchoolBranch: string;
  tranchesCount?: number | undefined;
}

export interface DonorStatsDto {
  totalGrantPortfolioBDT: number;
  totalDonors: number;
  activeGrantsCount: number;
  totalSponsoredChildren: number;
}
