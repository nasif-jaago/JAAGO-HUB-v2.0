export type AssetCategory =
  | "IT_EQUIPMENT"
  | "FURNITURE_FIXTURES"
  | "VEHICLES"
  | "SCHOOL_LAB_APPARATUS"
  | "BUILDING_INFRASTRUCTURE";

export type AssetStatus = "ACQUIRED" | "IN_SERVICE" | "UNDER_MAINTENANCE" | "DISPOSED" | "WRITTEN_OFF";
export type VehicleType = "MICROBUS" | "PICKUP_VAN" | "MOTORCYCLE" | "AMBULANCE";
export type VehicleStatus = "AVAILABLE" | "ON_TRIP" | "IN_WORKSHOP";

export interface FixedAssetDto {
  id: string;
  assetTag: string; // e.g. "AST-DHK-2026-0015"
  name: string;
  category: AssetCategory;
  branchCode: string; // e.g. "DHK", "RAJ", "BND"
  branchName: string; // e.g. "Dhaka Head Office", "Rajshahi School"
  custodianName: string; // Employee in-charge
  acquisitionDate: string;
  purchaseCostBDT: number;
  salvageValueBDT: number;
  usefulLifeYears: number;
  accumulatedDepreciationBDT: number;
  netBookValueBDT: number;
  status: AssetStatus;
}

export interface CreateFixedAssetDto {
  name: string;
  category: AssetCategory;
  branchCode: string;
  branchName: string;
  custodianName: string;
  acquisitionDate?: string | undefined;
  purchaseCostBDT: number;
  salvageValueBDT?: number | undefined;
  usefulLifeYears?: number | undefined;
}

export interface VehicleDto {
  id: string;
  regNumber: string; // e.g. "Dhaka Metro-Cha-11-2940"
  model: string;
  vehicleType: VehicleType;
  branchName: string;
  assignedDriver: string;
  odometerKM: number;
  fitnessExpiryDate: string;
  taxTokenExpiryDate: string;
  status: VehicleStatus;
}

export interface CreateVehicleDto {
  regNumber: string;
  model: string;
  vehicleType: VehicleType;
  branchName: string;
  assignedDriver: string;
  odometerKM: number;
  fitnessExpiryDate: string;
  taxTokenExpiryDate: string;
}

export interface VehicleTripLogDto {
  id: string;
  vehicleId: string;
  regNumber: string;
  tripDate: string;
  routeFromTo: string;
  driverName: string;
  startKM: number;
  endKM: number;
  distanceKM: number;
  fuelLitres: number;
  fuelCostBDT: number;
  purpose: string;
}

export interface CreateTripLogDto {
  vehicleId: string;
  tripDate?: string | undefined;
  routeFromTo: string;
  startKM: number;
  endKM: number;
  fuelLitres: number;
  fuelCostBDT: number;
  purpose: string;
}

export interface AssetStatsDto {
  totalAssetsCount: number;
  totalAcquisitionValueBDT: number;
  totalNetBookValueBDT: number;
  totalFleetVehicles: number;
  vehiclesInService: number;
}
