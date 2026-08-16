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
import { DonorsService } from "./donors.service.js";
import type {
  DonorDto,
  CreateDonorDto,
  GrantDto,
  CreateGrantDto,
  DonorStatsDto,
} from "./dto/donors.dto.js";

@ApiTags("Donors & Grant Management")
@ApiBearerAuth()
@Controller("api/v1/donors")
export class DonorsController {
  constructor(@Inject(DonorsService) private readonly donorsService: DonorsService) {}

  // ─── Donors ────────────────────────────────────────────────────────────────

  @Public()
  @Get()
  @ApiOperation({ summary: "List all donors and partner foundations with type filter" })
  getDonors(@Query("type") type?: string): DonorDto[] {
    return this.donorsService.getDonors(type);
  }

  @Public()
  @Post()
  @ApiOperation({ summary: "Register a new donor or institutional partner" })
  createDonor(@Body() dto: CreateDonorDto): DonorDto {
    return this.donorsService.createDonor(dto);
  }

  // ─── Grants ────────────────────────────────────────────────────────────────

  @Public()
  @Get("grants")
  @ApiOperation({ summary: "List institutional grant agreements and tranches" })
  getGrants(@Query("donorId") donorId?: string): GrantDto[] {
    return this.donorsService.getGrants(donorId);
  }

  @Public()
  @Post("grants")
  @ApiOperation({ summary: "Create a new institutional grant agreement" })
  createGrant(@Body() dto: CreateGrantDto): GrantDto {
    return this.donorsService.createGrant(dto);
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────

  @Public()
  @Get("stats")
  @ApiOperation({ summary: "Get total grant portfolio, active donors, and sponsorship stats" })
  getStats(): DonorStatsDto {
    return this.donorsService.getStats();
  }
}
