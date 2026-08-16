export type OperationalModel = "DIGITAL_ONLINE" | "PHYSICAL_CLASSROOM" | "HYBRID";
export type StudentGrade = "GRADE_1" | "GRADE_2" | "GRADE_3" | "GRADE_4" | "GRADE_5" | "GRADE_6" | "GRADE_7" | "GRADE_8" | "GRADE_9" | "GRADE_10";
export type SponsorshipStatus = "SPONSORED" | "UNSPONSORED" | "PENDING_SPONSOR";

export interface SchoolBranchDto {
  id: string;
  code: string; // e.g. "SCH-RAJ-01"
  name: string; // e.g. "JAAGO Rajshahi School"
  district: string;
  division: string;
  headmasterName: string;
  operationalModel: OperationalModel;
  capacity: number;
  enrolledStudentsCount: number;
  teacherCount: number;
  digitalClassroomsCount: number;
  isActive: boolean;
}

export interface CreateSchoolBranchDto {
  code: string;
  name: string;
  district: string;
  division: string;
  headmasterName: string;
  operationalModel: OperationalModel;
  capacity: number;
  digitalClassroomsCount?: number | undefined;
}

export interface StudentDto {
  id: string;
  studentId: string; // e.g. "STU-RAJ-2026-0042"
  fullName: string;
  gender: "MALE" | "FEMALE";
  grade: StudentGrade;
  schoolBranchCode: string;
  schoolBranchName: string;
  guardianName: string;
  guardianPhone: string;
  enrollmentDate: string;
  sponsorshipStatus: SponsorshipStatus;
  sponsorName?: string | undefined;
  attendanceRate: number; // e.g. 94.5%
}

export interface EnrollStudentDto {
  fullName: string;
  gender: "MALE" | "FEMALE";
  grade: StudentGrade;
  schoolBranchCode: string;
  schoolBranchName: string;
  guardianName: string;
  guardianPhone: string;
  sponsorshipStatus?: SponsorshipStatus | undefined;
}

export interface ClassroomSessionDto {
  id: string;
  subject: string; // e.g. "Mathematics"
  grade: StudentGrade;
  schoolBranchName: string;
  teacherName: string;
  scheduleTime: string; // e.g. "09:30 AM - 10:15 AM"
  mode: "DIGITAL_STUDIO" | "ON_SITE";
  roomNumber: string;
}

export interface CreateClassroomSessionDto {
  subject: string;
  grade: StudentGrade;
  schoolBranchName: string;
  teacherName: string;
  scheduleTime: string;
  mode: "DIGITAL_STUDIO" | "ON_SITE";
  roomNumber: string;
}

export interface SchoolStatsDto {
  totalSchools: number;
  totalStudents: number;
  sponsoredPercentage: number;
  averageAttendanceRate: number;
}
