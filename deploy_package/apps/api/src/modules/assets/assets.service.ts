import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { getLogger } from "@jaago/logger";
import { generateReferenceNumber } from "@jaago/integrations";
import type {
  FixedAssetDto,
  CreateFixedAssetDto,
  VehicleDto,
  CreateVehicleDto,
  VehicleTripLogDto,
  CreateTripLogDto,
  AssetStatsDto,
} from "./dto/assets.dto.js";

@Injectable()
export class AssetsService {
  private readonly assets: FixedAssetDto[] = [];
  private readonly vehicles: VehicleDto[] = [];
  private readonly tripLogs: VehicleTripLogDto[] = [];
  private assetSequenceCounter = 15;

  constructor() {
    this.seedDefaultAssetsData();
  }

  private safeLog(meta: Record<string, unknown>, message: string): void {
    try {
      getLogger().info(meta, message);
    } catch {
      // Logger uninitialized in tests
    }
  }

  private seedDefaultAssetsData(): void {
    // Default Fixed Assets
    this.assets.push(
      {
        id: "ast_1",
        assetTag: "AST-DHK-2026-0001",
        name: "Enterprise Core Server & Firewall Rack",
        category: "IT_EQUIPMENT",
        branchCode: "DHK",
        branchName: "Dhaka Head Office",
        custodianName: "Nasif Kamal (Head of Engineering)",
        acquisitionDate: "2024-01-15",
        purchaseCostBDT: 450000,
        salvageValueBDT: 45000,
        usefulLifeYears: 5,
        accumulatedDepreciationBDT: 162000,
        netBookValueBDT: 288000,
        status: "IN_SERVICE",
      },
      {
        id: "ast_2",
        assetTag: "AST-RAJ-2026-0002",
        name: "Solar Powered Digital Smart Classroom Projector",
        category: "SCHOOL_LAB_APPARATUS",
        branchCode: "RAJ",
        branchName: "Rajshahi School",
        custodianName: "Salma Khatun (Branch Head)",
        acquisitionDate: "2025-03-10",
        purchaseCostBDT: 180000,
        salvageValueBDT: 20000,
        usefulLifeYears: 4,
        accumulatedDepreciationBDT: 56667,
        netBookValueBDT: 123333,
        status: "IN_SERVICE",
      },
      {
        id: "ast_3",
        assetTag: "AST-BND-2026-0003",
        name: "Bandarban Field Operations Ambulance & Medical Van",
        category: "VEHICLES",
        branchCode: "BND",
        branchName: "Bandarban School",
        custodianName: "Siddiqur Rahman (Operations Manager)",
        acquisitionDate: "2023-06-01",
        purchaseCostBDT: 3200000,
        salvageValueBDT: 500000,
        usefulLifeYears: 8,
        accumulatedDepreciationBDT: 1068750,
        netBookValueBDT: 2131250,
        status: "IN_SERVICE",
      },
      {
        id: "ast_4",
        assetTag: "AST-DHK-2026-0004",
        name: "High-Capacity Dual Diesel Backup Generator 50kVA",
        category: "BUILDING_INFRASTRUCTURE",
        branchCode: "DHK",
        branchName: "Dhaka Head Office",
        custodianName: "Zahid Hossain (Facilities Supervisor)",
        acquisitionDate: "2022-08-20",
        purchaseCostBDT: 1250000,
        salvageValueBDT: 150000,
        usefulLifeYears: 10,
        accumulatedDepreciationBDT: 440000,
        netBookValueBDT: 810000,
        status: "IN_SERVICE",
      },
    );

    // Fleet Vehicles
    this.vehicles.push(
      {
        id: "veh_1",
        regNumber: "Dhaka Metro-Cha-11-2940",
        model: "Toyota HiAce 14-Seater Community Van",
        vehicleType: "MICROBUS",
        branchName: "Dhaka Head Office",
        assignedDriver: "Rafiqul Islam",
        odometerKM: 74250,
        fitnessExpiryDate: "2027-02-15",
        taxTokenExpiryDate: "2026-11-30",
        status: "AVAILABLE",
      },
      {
        id: "veh_2",
        regNumber: "Bandarban-Ga-11-0422",
        model: "Toyota Hilux 4x4 Hill Terrain Pickup",
        vehicleType: "PICKUP_VAN",
        branchName: "Bandarban School",
        assignedDriver: "Moinul Haque",
        odometerKM: 112400,
        fitnessExpiryDate: "2026-12-10",
        taxTokenExpiryDate: "2026-10-15",
        status: "AVAILABLE",
      },
    );

    // Trip Logs
    this.tripLogs.push({
      id: "trip_1",
      vehicleId: "veh_1",
      regNumber: "Dhaka Metro-Cha-11-2940",
      tripDate: "2026-08-14",
      routeFromTo: "Dhaka HQ -> Gazipur School -> Dhaka HQ",
      driverName: "Rafiqul Islam",
      startKM: 74120,
      endKM: 74250,
      distanceKM: 130,
      fuelLitres: 18,
      fuelCostBDT: 2430,
      purpose: "Delivery of science kit apparatus and academic evaluation visit",
    });
  }

  // ─── Fixed Assets ──────────────────────────────────────────────────────────

  getAssets(category?: string, branch?: string): FixedAssetDto[] {
    return this.assets.filter((a) => {
      if (category && category !== "ALL" && a.category !== category) return false;
      if (branch && branch !== "ALL" && a.branchCode !== branch) return false;
      return true;
    });
  }

  createAsset(dto: CreateFixedAssetDto): FixedAssetDto {
    this.assetSequenceCounter += 1;
    const branchCode = dto.branchCode.toUpperCase();
    const assetTag = generateReferenceNumber({
      documentType: "ASSET_TAG",
      sequence: this.assetSequenceCounter,
      branchCode,
    });

    const salvage = dto.salvageValueBDT || Math.round(dto.purchaseCostBDT * 0.1);
    const lifeYears = dto.usefulLifeYears || 5;
    const acquisitionDate = dto.acquisitionDate || new Date().toISOString().split("T")[0]!;

    const asset: FixedAssetDto = {
      id: `ast_${Date.now().toString(36)}`,
      assetTag,
      name: dto.name,
      category: dto.category,
      branchCode,
      branchName: dto.branchName,
      custodianName: dto.custodianName,
      acquisitionDate,
      purchaseCostBDT: dto.purchaseCostBDT,
      salvageValueBDT: salvage,
      usefulLifeYears: lifeYears,
      accumulatedDepreciationBDT: 0,
      netBookValueBDT: dto.purchaseCostBDT,
      status: "IN_SERVICE",
    };

    this.assets.unshift(asset);
    this.safeLog(
      { assetTag, name: asset.name, cost: asset.purchaseCostBDT, branch: asset.branchName },
      `Registered Asset ${assetTag} - ${asset.name}`,
    );

    return asset;
  }

  // ─── Fleet Vehicles ────────────────────────────────────────────────────────

  getVehicles(): VehicleDto[] {
    return this.vehicles;
  }

  createVehicle(dto: CreateVehicleDto): VehicleDto {
    const existing = this.vehicles.find((v) => v.regNumber.toLowerCase() === dto.regNumber.toLowerCase());
    if (existing) {
      throw new BadRequestException(`Vehicle with registration ${dto.regNumber} already exists.`);
    }

    const vehicle: VehicleDto = {
      id: `veh_${Date.now().toString(36)}`,
      regNumber: dto.regNumber,
      model: dto.model,
      vehicleType: dto.vehicleType,
      branchName: dto.branchName,
      assignedDriver: dto.assignedDriver,
      odometerKM: dto.odometerKM,
      fitnessExpiryDate: dto.fitnessExpiryDate,
      taxTokenExpiryDate: dto.taxTokenExpiryDate,
      status: "AVAILABLE",
    };

    this.vehicles.push(vehicle);
    this.safeLog({ reg: vehicle.regNumber, driver: vehicle.assignedDriver }, `Added Vehicle ${vehicle.regNumber}`);
    return vehicle;
  }

  // ─── Trip & Fuel Logs ──────────────────────────────────────────────────────

  getTripLogs(vehicleId?: string): VehicleTripLogDto[] {
    return this.tripLogs
      .filter((t) => (!vehicleId || vehicleId === "ALL" ? true : t.vehicleId === vehicleId))
      .sort((a, b) => new Date(b.tripDate).getTime() - new Date(a.tripDate).getTime());
  }

  createTripLog(dto: CreateTripLogDto): VehicleTripLogDto {
    const vehicle = this.vehicles.find((v) => v.id === dto.vehicleId);
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ID ${dto.vehicleId} not found.`);
    }

    if (dto.endKM < dto.startKM) {
      throw new BadRequestException("End odometer KM cannot be less than start odometer KM.");
    }

    const distanceKM = dto.endKM - dto.startKM;
    const trip: VehicleTripLogDto = {
      id: `trip_${Date.now().toString(36)}`,
      vehicleId: vehicle.id,
      regNumber: vehicle.regNumber,
      tripDate: dto.tripDate || new Date().toISOString().split("T")[0]!,
      routeFromTo: dto.routeFromTo,
      driverName: vehicle.assignedDriver,
      startKM: dto.startKM,
      endKM: dto.endKM,
      distanceKM,
      fuelLitres: dto.fuelLitres,
      fuelCostBDT: dto.fuelCostBDT,
      purpose: dto.purpose,
    };

    // Update vehicle odometer
    vehicle.odometerKM = dto.endKM;

    this.tripLogs.unshift(trip);
    this.safeLog(
      { vehicle: vehicle.regNumber, distanceKM, fuelCost: dto.fuelCostBDT },
      `Logged trip of ${distanceKM} km for ${vehicle.regNumber}`,
    );

    return trip;
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────

  getStats(): AssetStatsDto {
    const totalAcq = this.assets.reduce((sum, a) => sum + a.purchaseCostBDT, 0);
    const totalNbv = this.assets.reduce((sum, a) => sum + a.netBookValueBDT, 0);
    const activeVehicles = this.vehicles.filter((v) => v.status === "AVAILABLE" || v.status === "ON_TRIP").length;

    return {
      totalAssetsCount: this.assets.length,
      totalAcquisitionValueBDT: totalAcq,
      totalNetBookValueBDT: totalNbv,
      totalFleetVehicles: this.vehicles.length,
      vehiclesInService: activeVehicles,
    };
  }
}
