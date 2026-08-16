import { describe, it, expect, beforeEach } from "vitest";
import { AssetsService } from "../src/modules/assets/assets.service.js";
import { AssetsController } from "../src/modules/assets/assets.controller.js";

describe("Fixed Assets & Fleet Logistics Module", () => {
  let assetsService: AssetsService;
  let assetsController: AssetsController;

  beforeEach(() => {
    assetsService = new AssetsService();
    assetsController = new AssetsController(assetsService);
  });

  it("lists initial fixed assets and calculates asset valuation statistics", () => {
    const assets = assetsController.getAssets();
    expect(assets.length).toBeGreaterThanOrEqual(4);

    const stats = assetsController.getStats();
    expect(stats.totalAssetsCount).toBeGreaterThanOrEqual(4);
    expect(stats.totalAcquisitionValueBDT).toBeGreaterThan(0);
    expect(stats.totalNetBookValueBDT).toBeGreaterThan(0);
  });

  it("registers a new fixed asset with sequential branch asset tag", () => {
    const asset = assetsController.createAsset({
      name: "Smart Interactive Digital Board 75-inch",
      category: "SCHOOL_LAB_APPARATUS",
      branchCode: "RAJ",
      branchName: "Rajshahi School",
      custodianName: "Salma Khatun",
      purchaseCostBDT: 150000,
      salvageValueBDT: 15000,
      usefulLifeYears: 5,
    });

    expect(asset.assetTag).toMatch(/^AST-RAJ-\d{4}-\d{4}$/);
    expect(asset.netBookValueBDT).toBe(150000);
    expect(asset.status).toBe("IN_SERVICE");
  });

  it("registers a new fleet vehicle and records trip and fuel logs", () => {
    const vehicle = assetsController.createVehicle({
      regNumber: "Chittagong-Metro-Cha-55-1102",
      model: "Toyota TownAce Microbus",
      vehicleType: "MICROBUS",
      branchName: "Chittagong School",
      assignedDriver: "Kamal Uddin",
      odometerKM: 45000,
      fitnessExpiryDate: "2027-01-15",
      taxTokenExpiryDate: "2026-12-31",
    });

    expect(vehicle.regNumber).toBe("Chittagong-Metro-Cha-55-1102");
    expect(vehicle.status).toBe("AVAILABLE");

    const trip = assetsController.createTripLog({
      vehicleId: vehicle.id,
      routeFromTo: "Chittagong School -> Cox's Bazar Community Center -> Chittagong",
      startKM: 45000,
      endKM: 45280,
      fuelLitres: 35,
      fuelCostBDT: 4725,
      purpose: "Student science competition field trip",
    });

    expect(trip.distanceKM).toBe(280);
    expect(trip.fuelCostBDT).toBe(4725);

    // Verify vehicle odometer was updated
    const updatedVehicles = assetsController.getVehicles();
    const targetVeh = updatedVehicles.find((v) => v.id === vehicle.id);
    expect(targetVeh?.odometerKM).toBe(45280);
  });

  it("rejects trip log where end odometer KM is less than start odometer KM", () => {
    const vehicles = assetsController.getVehicles();
    const firstVeh = vehicles[0]!;

    expect(() =>
      assetsController.createTripLog({
        vehicleId: firstVeh.id,
        routeFromTo: "Dhaka -> Gazipur",
        startKM: 80000,
        endKM: 79000, // Invalid end odometer!
        fuelLitres: 10,
        fuelCostBDT: 1350,
        purpose: "Testing invalid odometer",
      }),
    ).toThrowError(/End odometer KM cannot be less/);
  });
});
