import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { getLogger } from "@jaago/logger";
import type {
  AttendanceRecordDto,
  AttendanceSettingsDto,
  BranchGeofenceConfig,
  ClockInDto,
  ClockOutDto,
} from "./dto/attendance.dto.js";

@Injectable()
export class AttendanceService {
  private readonly records: AttendanceRecordDto[] = [];
  private settings: AttendanceSettingsDto = {
    enforceGeofence: true,
    standardWorkHours: 8,
    shiftStartTime: "09:00",
    lateGraceMinutes: 15,
    branchGeofences: [
      {
        id: "geo_dhk",
        branchName: "Dhaka HQ (Banani)",
        latitude: 23.7937,
        longitude: 90.4066,
        allowedRadiusMeters: 200,
        biometricDeviceId: "BIO-DHK-01",
        biometricDeviceIp: "192.168.10.50",
        isActive: true,
      },
      {
        id: "geo_raj",
        branchName: "Rajshahi School Branch",
        latitude: 24.3745,
        longitude: 88.6042,
        allowedRadiusMeters: 250,
        biometricDeviceId: "BIO-RAJ-01",
        biometricDeviceIp: "192.168.20.50",
        isActive: true,
      },
      {
        id: "geo_ctg",
        branchName: "Chittagong School Branch",
        latitude: 22.3569,
        longitude: 91.7832,
        allowedRadiusMeters: 200,
        biometricDeviceId: "BIO-CTG-01",
        biometricDeviceIp: "192.168.30.50",
        isActive: true,
      },
      {
        id: "geo_hab",
        branchName: "Habiganj School Branch",
        latitude: 24.3749,
        longitude: 91.4155,
        allowedRadiusMeters: 300,
        biometricDeviceId: "BIO-HAB-01",
        biometricDeviceIp: "192.168.40.50",
        isActive: true,
      },
      {
        id: "geo_ban",
        branchName: "Bandarban School Branch",
        latitude: 22.1953,
        longitude: 92.2184,
        allowedRadiusMeters: 350,
        biometricDeviceId: "BIO-BAN-01",
        biometricDeviceIp: "192.168.50.50",
        isActive: true,
      },
    ],
  };

  constructor() {
    this.seedDefaultAttendance();
  }

  private safeLog(meta: Record<string, unknown>, message: string): void {
    try {
      getLogger().info(meta, message);
    } catch {
      // Logger uninitialized in unit tests
    }
  }

  private seedDefaultAttendance(): void {
    const orgId = "00000000-0000-0000-0000-000000000000";
    const today = new Date().toISOString().split("T")[0]!;

    this.records.push(
      {
        id: "att_101",
        orgId,
        employeeId: "emp_1",
        employeeName: "Nasif Kamal",
        employeeCode: "EMP-1001",
        date: today,
        clockInTime: `${today}T08:52:00.000Z`,
        status: "PRESENT",
        method: "BIOMETRIC_DEVICE",
        branchName: "Dhaka HQ (Banani)",
        withinGeofence: true,
        distanceToBranchMeters: 12,
        isLate: false,
        lateMinutes: 0,
      },
      {
        id: "att_102",
        orgId,
        employeeId: "emp_2",
        employeeName: "Salma Khatun",
        employeeCode: "EMP-1002",
        date: today,
        clockInTime: `${today}T09:22:00.000Z`,
        status: "LATE",
        method: "GEOFENCED_MOBILE",
        branchName: "Rajshahi School Branch",
        withinGeofence: true,
        distanceToBranchMeters: 45,
        isLate: true,
        lateMinutes: 22,
      },
    );
  }

  /**
   * Calculates distance between 2 coordinates in meters using the Haversine formula
   */
  calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }

  getSettings(): AttendanceSettingsDto {
    return this.settings;
  }

  updateSettings(dto: AttendanceSettingsDto): AttendanceSettingsDto {
    this.settings = {
      ...this.settings,
      ...dto,
    };
    this.safeLog({ branchCount: this.settings.branchGeofences.length }, "Updated attendance geofence and biometric settings");
    return this.settings;
  }

  updateBranchGeofence(branchId: string, updated: Partial<BranchGeofenceConfig>): BranchGeofenceConfig {
    const branch = this.settings.branchGeofences.find((b) => b.id === branchId);
    if (!branch) {
      throw new NotFoundException(`Branch geofence ${branchId} not found`);
    }

    Object.assign(branch, updated);
    this.safeLog({ branchId, name: branch.branchName }, `Updated branch geofence configuration for ${branch.branchName}`);
    return branch;
  }

  addBranchGeofence(config: Omit<BranchGeofenceConfig, "id">): BranchGeofenceConfig {
    const id = `geo_${Date.now().toString(36)}`;
    const newBranch: BranchGeofenceConfig = {
      id,
      ...config,
      isActive: config.isActive !== undefined ? config.isActive : true,
    };

    this.settings.branchGeofences.push(newBranch);
    return newBranch;
  }

  getAttendanceRecords(
    orgId: string,
    filters?: { employeeId?: string | undefined; date?: string | undefined; limit?: number | undefined },
  ): { items: AttendanceRecordDto[]; total: number } {
    let list = this.records.filter((r) => r.orgId === orgId);

    if (filters?.employeeId) {
      list = list.filter((r) => r.employeeId === filters.employeeId);
    }
    if (filters?.date) {
      list = list.filter((r) => r.date === filters.date);
    }

    const limit = Math.min(Math.max(filters?.limit || 50, 1), 200);
    return {
      items: list.slice(0, limit),
      total: list.length,
    };
  }

  clockIn(
    orgId: string,
    employee: { id: string; fullName: string; employeeCode: string; branchName?: string | undefined },
    dto: ClockInDto,
  ): AttendanceRecordDto {
    const today = new Date().toISOString().split("T")[0]!;
    const existing = this.records.find((r) => r.orgId === orgId && r.employeeId === employee.id && r.date === today);

    if (existing) {
      throw new BadRequestException(`Employee ${employee.fullName} is already clocked in today at ${existing.clockInTime}`);
    }

    // Geofence validation
    let withinGeofence = true;
    let distanceToBranch = 0;
    const branch = this.settings.branchGeofences.find(
      (b) => b.branchName === (employee.branchName || "Dhaka HQ (Banani)") || b.isActive,
    ) || this.settings.branchGeofences[0]!;

    if (dto.method === "GEOFENCED_MOBILE" && dto.latitude && dto.longitude) {
      distanceToBranch = this.calculateDistanceMeters(
        dto.latitude,
        dto.longitude,
        branch.latitude,
        branch.longitude,
      );

      withinGeofence = distanceToBranch <= branch.allowedRadiusMeters;

      if (this.settings.enforceGeofence && !withinGeofence) {
        throw new BadRequestException(
          `Location check failed: You are ${distanceToBranch}m away from ${branch.branchName}. Max allowed radius is ${branch.allowedRadiusMeters}m.`,
        );
      }
    }

    // Late calculation
    const now = new Date();
    const [startH = 9, startM = 0] = this.settings.shiftStartTime.split(":").map(Number);
    const expectedTime = new Date(now);
    expectedTime.setHours(startH, startM, 0, 0);

    const diffMinutes = Math.floor((now.getTime() - expectedTime.getTime()) / 60000);
    const isLate = diffMinutes > this.settings.lateGraceMinutes;
    const lateMinutes = isLate ? diffMinutes : 0;

    const id = `att_${Date.now().toString(36)}`;
    const record: AttendanceRecordDto = {
      id,
      orgId,
      employeeId: employee.id,
      employeeName: employee.fullName,
      employeeCode: employee.employeeCode,
      date: today,
      clockInTime: now.toISOString(),
      status: isLate ? "LATE" : "PRESENT",
      method: dto.method,
      branchName: branch.branchName,
      withinGeofence,
      distanceToBranchMeters: distanceToBranch,
      isLate,
      lateMinutes,
    };

    this.records.unshift(record);
    this.safeLog(
      { orgId, employeeId: employee.id, method: dto.method, status: record.status },
      `Clocked in ${employee.fullName}: ${record.status}`,
    );

    return record;
  }

  clockOut(orgId: string, employeeId: string, _dto: ClockOutDto): AttendanceRecordDto {
    const today = new Date().toISOString().split("T")[0]!;
    const record = this.records.find((r) => r.orgId === orgId && r.employeeId === employeeId && r.date === today);

    if (!record) {
      throw new NotFoundException("No active clock-in record found for today.");
    }

    if (record.clockOutTime) {
      throw new BadRequestException("Employee has already clocked out for today.");
    }

    const now = new Date();
    record.clockOutTime = now.toISOString();
    record.durationMinutes = Math.floor(
      (now.getTime() - new Date(record.clockInTime).getTime()) / 60000,
    );

    this.safeLog({ orgId, employeeId, durationMinutes: record.durationMinutes }, `Clocked out ${record.employeeName}`);
    return record;
  }

  getTodayStats(orgId: string): { present: number; late: number; onLeave: number; totalExpected: number } {
    const today = new Date().toISOString().split("T")[0]!;
    const todayRecords = this.records.filter((r) => r.orgId === orgId && r.date === today);

    return {
      present: todayRecords.filter((r) => r.status === "PRESENT").length,
      late: todayRecords.filter((r) => r.status === "LATE").length,
      onLeave: 0,
      totalExpected: 50,
    };
  }
}
