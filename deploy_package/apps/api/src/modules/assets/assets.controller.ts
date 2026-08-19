import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Inject,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Public } from "../../common/decorators/require-permission.decorator.js";
import { AssetsService } from "./assets.service.js";
import type {
  FixedAssetDto,
  CreateFixedAssetDto,
  VehicleDto,
  CreateVehicleDto,
  VehicleTripLogDto,
  CreateTripLogDto,
  AssetStatsDto,
} from "./dto/assets.dto.js";

@ApiTags("Fixed Assets & Fleet Logistics")
@ApiBearerAuth()
@Controller("api/v1/assets")
export class AssetsController {
  constructor(@Inject(AssetsService) private readonly assetsService: AssetsService) {}

  // ─── Fixed Assets ──────────────────────────────────────────────────────────

  @Public()
  @Get()
  @ApiOperation({ summary: "Get Fixed Assets register with category and branch filter" })
  getAssets(
    @Query("category") category?: string,
    @Query("branch") branch?: string,
  ): FixedAssetDto[] {
    return this.assetsService.getAssets(category, branch);
  }

  @Public()
  @Post()
  @ApiOperation({ summary: "Register new Fixed Asset and assign branch asset tag" })
  createAsset(@Body() dto: CreateFixedAssetDto): FixedAssetDto {
    return this.assetsService.createAsset(dto);
  }

  // ─── Fleet Vehicles ────────────────────────────────────────────────────────

  @Public()
  @Get("vehicles")
  @ApiOperation({ summary: "List all fleet vehicles and fitness status" })
  getVehicles(): VehicleDto[] {
    return this.assetsService.getVehicles();
  }

  @Public()
  @Post("vehicles")
  @ApiOperation({ summary: "Register a new fleet vehicle" })
  createVehicle(@Body() dto: CreateVehicleDto): VehicleDto {
    return this.assetsService.createVehicle(dto);
  }

  // ─── Trip Logs ─────────────────────────────────────────────────────────────

  @Public()
  @Get("trips")
  @ApiOperation({ summary: "Get vehicle trip logs and fuel consumption records" })
  getTripLogs(@Query("vehicleId") vehicleId?: string): VehicleTripLogDto[] {
    return this.assetsService.getTripLogs(vehicleId);
  }

  @Public()
  @Post("trips")
  @ApiOperation({ summary: "Log a vehicle trip, mileage, and fuel expense" })
  createTripLog(@Body() dto: CreateTripLogDto): VehicleTripLogDto {
    return this.assetsService.createTripLog(dto);
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────

  @Public()
  @Get("stats")
  @ApiOperation({ summary: "Get fixed asset valuation, NBV, and fleet KPI statistics" })
  getStats(): AssetStatsDto {
    return this.assetsService.getStats();
  }
}
