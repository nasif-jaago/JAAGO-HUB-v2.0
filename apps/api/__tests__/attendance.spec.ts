import { describe, it, expect, beforeEach } from "vitest";
import { AttendanceService } from "../src/modules/attendance/attendance.service.js";
import { AttendanceController } from "../src/modules/attendance/attendance.controller.js";

describe("Attendance & Geofencing Module", () => {
  let attendanceService: AttendanceService;
  let attendanceController: AttendanceController;
  const mockOrgId = "00000000-0000-0000-0000-000000000000";
  const mockReq = { tenant: { orgId: mockOrgId }, user: { id: "emp_10", displayName: "Farhana Yasmin" }, headers: {} };

  beforeEach(() => {
    attendanceService = new AttendanceService();
    attendanceController = new AttendanceController(attendanceService);
  });

  describe("Geofence & Distance Computation", () => {
    it("computes accurate distance in meters between two GPS coordinates", () => {
      // Distance from Dhaka Banani HQ (23.7937, 90.4066) to nearby spot (23.7940, 90.4070)
      const distance = attendanceService.calculateDistanceMeters(23.7937, 90.4066, 23.7940, 90.4070);
      expect(distance).toBeGreaterThan(20);
      expect(distance).toBeLessThan(100);
    });

    it("allows clock-in when employee is within allowed branch radius", () => {
      const record = attendanceController.clockIn(mockReq, {
        method: "GEOFENCED_MOBILE",
        latitude: 23.7938,
        longitude: 90.4067,
      });

      expect(record.id).toBeDefined();
      expect(record.withinGeofence).toBe(true);
      expect(record.distanceToBranchMeters).toBeLessThan(200);
    });

    it("rejects clock-in when employee is outside geofence and enforcement is active", () => {
      expect(() => {
        attendanceController.clockIn(mockReq, {
          method: "GEOFENCED_MOBILE",
          latitude: 23.8500, // miles away
          longitude: 90.5000,
        });
      }).toThrow("Location check failed: You are");
    });
  });

  describe("Admin Geofence & Biometric Device Configuration", () => {
    it("retrieves current branch geofence and biometric settings", () => {
      const config = attendanceController.getSettings();
      expect(config.enforceGeofence).toBe(true);
      expect(config.branchGeofences.length).toBeGreaterThanOrEqual(5);

      const dhk = config.branchGeofences.find((b) => b.id === "geo_dhk");
      expect(dhk?.biometricDeviceId).toBe("BIO-DHK-01");
      expect(dhk?.biometricDeviceIp).toBe("192.168.10.50");
    });

    it("updates branch geofence coordinates and biometric device IP", () => {
      const updated = attendanceController.updateBranchGeofence("geo_dhk", {
        allowedRadiusMeters: 250,
        biometricDeviceIp: "192.168.10.99",
      });

      expect(updated.allowedRadiusMeters).toBe(250);
      expect(updated.biometricDeviceIp).toBe("192.168.10.99");
    });

    it("adds a new school branch geofence boundary", () => {
      const added = attendanceController.addBranchGeofence({
        branchName: "Korigram School Branch",
        latitude: 25.8072,
        longitude: 89.6295,
        allowedRadiusMeters: 300,
        biometricDeviceId: "BIO-KOR-01",
        biometricDeviceIp: "192.168.60.50",
        isActive: true,
      });

      expect(added.id).toBeDefined();
      expect(added.branchName).toBe("Korigram School Branch");

      const config = attendanceController.getSettings();
      expect(config.branchGeofences.some((b) => b.id === added.id)).toBe(true);
    });
  });
});
