export type AttendanceMethod = "GEOFENCED_MOBILE" | "BIOMETRIC_DEVICE" | "WEB_MANUAL";
export type AttendanceStatus = "PRESENT" | "LATE" | "HALF_DAY" | "ABSENT" | "ON_LEAVE";

export interface BranchGeofenceConfig {
  id: string;
  branchName: string;
  latitude: number;
  longitude: number;
  allowedRadiusMeters: number;
  biometricDeviceId?: string | undefined;
  biometricDeviceIp?: string | undefined;
  isActive: boolean;
}

export interface AttendanceSettingsDto {
  enforceGeofence: boolean;
  standardWorkHours: number;
  shiftStartTime: string; // e.g. "09:00"
  lateGraceMinutes: number; // e.g. 15
  branchGeofences: BranchGeofenceConfig[];
}

export interface ClockInDto {
  latitude?: number | undefined;
  longitude?: number | undefined;
  accuracyMeters?: number | undefined;
  biometricDeviceId?: string | undefined;
  method: AttendanceMethod;
  notes?: string | undefined;
}

export interface ClockOutDto {
  latitude?: number | undefined;
  longitude?: number | undefined;
  notes?: string | undefined;
}

export interface AttendanceRecordDto {
  id: string;
  orgId: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  date: string; // "YYYY-MM-DD"
  clockInTime: string; // ISO
  clockOutTime?: string | undefined;
  durationMinutes?: number | undefined;
  status: AttendanceStatus;
  method: AttendanceMethod;
  branchName: string;
  withinGeofence: boolean;
  distanceToBranchMeters?: number | undefined;
  isLate: boolean;
  lateMinutes: number;
}
