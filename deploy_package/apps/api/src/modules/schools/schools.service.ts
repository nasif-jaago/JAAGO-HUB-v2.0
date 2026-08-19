import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { getLogger } from "@jaago/logger";
import type {
  SchoolBranchDto,
  CreateSchoolBranchDto,
  StudentDto,
  EnrollStudentDto,
  ClassroomSessionDto,
  CreateClassroomSessionDto,
  SchoolStatsDto,
} from "./dto/schools.dto.js";

@Injectable()
export class SchoolsService {
  private readonly schools: SchoolBranchDto[] = [];
  private readonly students: StudentDto[] = [];
  private readonly sessions: ClassroomSessionDto[] = [];
  private studentSequenceCounter = 42;

  constructor() {
    this.seedDefaultSchoolsData();
  }

  private safeLog(meta: Record<string, unknown>, message: string): void {
    try {
      getLogger().info(meta, message);
    } catch {
      // Logger uninitialized in tests
    }
  }

  private seedDefaultSchoolsData(): void {
    // Default School Branches
    this.schools.push(
      {
        id: "sch_1",
        code: "SCH-RAJ-01",
        name: "JAAGO Rajshahi Branch School",
        district: "Rajshahi",
        division: "Rajshahi",
        headmasterName: "Salma Khatun",
        operationalModel: "HYBRID",
        capacity: 350,
        enrolledStudentsCount: 280,
        teacherCount: 14,
        digitalClassroomsCount: 4,
        isActive: true,
      },
      {
        id: "sch_2",
        code: "SCH-BND-02",
        name: "JAAGO Bandarban Hill Tracts School",
        district: "Bandarban",
        division: "Chittagong",
        headmasterName: "Siddiqur Rahman",
        operationalModel: "PHYSICAL_CLASSROOM",
        capacity: 250,
        enrolledStudentsCount: 195,
        teacherCount: 10,
        digitalClassroomsCount: 2,
        isActive: true,
      },
      {
        id: "sch_3",
        code: "SCH-HBG-03",
        name: "JAAGO Habiganj Tea Estate School",
        district: "Habiganj",
        division: "Sylhet",
        headmasterName: "Anisur Rahman",
        operationalModel: "HYBRID",
        capacity: 220,
        enrolledStudentsCount: 175,
        teacherCount: 9,
        digitalClassroomsCount: 3,
        isActive: true,
      },
      {
        id: "sch_4",
        code: "SCH-CTG-04",
        name: "JAAGO Chittagong Coastal School",
        district: "Chittagong",
        division: "Chittagong",
        headmasterName: "Farhana Yasmin",
        operationalModel: "DIGITAL_ONLINE",
        capacity: 400,
        enrolledStudentsCount: 310,
        teacherCount: 16,
        digitalClassroomsCount: 6,
        isActive: true,
      },
      {
        id: "sch_5",
        code: "SCH-GZP-05",
        name: "JAAGO Gazipur Industrial Belt School",
        district: "Gazipur",
        division: "Dhaka",
        headmasterName: "Kamrul Hasan",
        operationalModel: "HYBRID",
        capacity: 300,
        enrolledStudentsCount: 240,
        teacherCount: 12,
        digitalClassroomsCount: 4,
        isActive: true,
      },
    );

    // Default Students
    this.students.push(
      {
        id: "stu_1",
        studentId: "STU-RAJ-2026-0001",
        fullName: "Ayesha Akhter",
        gender: "FEMALE",
        grade: "GRADE_3",
        schoolBranchCode: "SCH-RAJ-01",
        schoolBranchName: "JAAGO Rajshahi Branch School",
        guardianName: "Mokbul Hossain",
        guardianPhone: "+8801711223344",
        enrollmentDate: "2024-01-10",
        sponsorshipStatus: "SPONSORED",
        sponsorName: "Dr. David Sterling (UK Donor)",
        attendanceRate: 96.5,
      },
      {
        id: "stu_2",
        studentId: "STU-BND-2026-0002",
        fullName: "Chongrak Marma",
        gender: "MALE",
        grade: "GRADE_4",
        schoolBranchCode: "SCH-BND-02",
        schoolBranchName: "JAAGO Bandarban Hill Tracts School",
        guardianName: "Hlaing Marma",
        guardianPhone: "+8801822334455",
        enrollmentDate: "2023-01-15",
        sponsorshipStatus: "SPONSORED",
        sponsorName: "Faber Foundation Australia",
        attendanceRate: 94.0,
      },
      {
        id: "stu_3",
        studentId: "STU-HBG-2026-0003",
        fullName: "Ruma Bauri",
        gender: "FEMALE",
        grade: "GRADE_2",
        schoolBranchCode: "SCH-HBG-03",
        schoolBranchName: "JAAGO Habiganj Tea Estate School",
        guardianName: "Bishwanath Bauri",
        guardianPhone: "+8801933445566",
        enrollmentDate: "2025-01-12",
        sponsorshipStatus: "PENDING_SPONSOR",
        attendanceRate: 91.2,
      },
      {
        id: "stu_4",
        studentId: "STU-CTG-2026-0004",
        fullName: "Tanvir Hasan",
        gender: "MALE",
        grade: "GRADE_5",
        schoolBranchCode: "SCH-CTG-04",
        schoolBranchName: "JAAGO Chittagong Coastal School",
        guardianName: "Kabir Ahmed",
        guardianPhone: "+8801644556677",
        enrollmentDate: "2022-01-08",
        sponsorshipStatus: "SPONSORED",
        sponsorName: "Standard Chartered Community Trust",
        attendanceRate: 98.0,
      },
    );

    // Default Classroom Sessions
    this.sessions.push(
      {
        id: "ses_1",
        subject: "Mathematics & Geometry",
        grade: "GRADE_3",
        schoolBranchName: "JAAGO Rajshahi Branch School",
        teacherName: "Tahmina Chowdhury (Live from Dhaka Studio)",
        scheduleTime: "09:30 AM - 10:15 AM",
        mode: "DIGITAL_STUDIO",
        roomNumber: "Digital Lab-1",
      },
      {
        id: "ses_2",
        subject: "General Science & Environment",
        grade: "GRADE_4",
        schoolBranchName: "JAAGO Bandarban Hill Tracts School",
        teacherName: "Siddiqur Rahman",
        scheduleTime: "10:30 AM - 11:15 AM",
        mode: "ON_SITE",
        roomNumber: "Classroom 4A",
      },
      {
        id: "ses_3",
        subject: "English Communicative Skills",
        grade: "GRADE_5",
        schoolBranchName: "JAAGO Chittagong Coastal School",
        teacherName: "Nasreen Sultana (Live from Dhaka Studio)",
        scheduleTime: "11:30 AM - 12:15 PM",
        mode: "DIGITAL_STUDIO",
        roomNumber: "Studio Room 2",
      },
    );
  }

  // ─── School Branches ───────────────────────────────────────────────────────

  getSchools(): SchoolBranchDto[] {
    return this.schools;
  }

  createSchool(dto: CreateSchoolBranchDto): SchoolBranchDto {
    const existing = this.schools.find((s) => s.code.toLowerCase() === dto.code.toLowerCase());
    if (existing) {
      throw new BadRequestException(`School with code ${dto.code} already exists.`);
    }

    const school: SchoolBranchDto = {
      id: `sch_${Date.now().toString(36)}`,
      code: dto.code.toUpperCase(),
      name: dto.name,
      district: dto.district,
      division: dto.division,
      headmasterName: dto.headmasterName,
      operationalModel: dto.operationalModel,
      capacity: dto.capacity,
      enrolledStudentsCount: 0,
      teacherCount: 5,
      digitalClassroomsCount: dto.digitalClassroomsCount || 2,
      isActive: true,
    };

    this.schools.push(school);
    this.safeLog({ code: school.code, name: school.name }, `Added School Branch ${school.name}`);
    return school;
  }

  // ─── Students ──────────────────────────────────────────────────────────────

  getStudents(branchCode?: string, grade?: string): StudentDto[] {
    return this.students.filter((s) => {
      if (branchCode && branchCode !== "ALL" && s.schoolBranchCode !== branchCode) return false;
      if (grade && grade !== "ALL" && s.grade !== grade) return false;
      return true;
    });
  }

  enrollStudent(dto: EnrollStudentDto): StudentDto {
    const school = this.schools.find((s) => s.code === dto.schoolBranchCode);
    if (!school) {
      throw new NotFoundException(`School branch ${dto.schoolBranchCode} not found.`);
    }

    this.studentSequenceCounter += 1;
    const year = new Date().getFullYear();
    const branchTag = dto.schoolBranchCode.split("-")[1] || "BRN";
    const studentId = `STU-${branchTag}-${year}-${this.studentSequenceCounter.toString().padStart(4, "0")}`;

    const student: StudentDto = {
      id: `stu_${Date.now().toString(36)}`,
      studentId,
      fullName: dto.fullName,
      gender: dto.gender,
      grade: dto.grade,
      schoolBranchCode: dto.schoolBranchCode,
      schoolBranchName: school.name,
      guardianName: dto.guardianName,
      guardianPhone: dto.guardianPhone,
      enrollmentDate: new Date().toISOString().split("T")[0]!,
      sponsorshipStatus: dto.sponsorshipStatus || "PENDING_SPONSOR",
      attendanceRate: 100.0,
    };

    // Increment school enrollment count
    school.enrolledStudentsCount += 1;

    this.students.unshift(student);
    this.safeLog(
      { studentId, name: student.fullName, school: school.name },
      `Enrolled student ${student.fullName} (${studentId}) at ${school.name}`,
    );

    return student;
  }

  // ─── Classroom Sessions ────────────────────────────────────────────────────

  getSessions(): ClassroomSessionDto[] {
    return this.sessions;
  }

  createSession(dto: CreateClassroomSessionDto): ClassroomSessionDto {
    const session: ClassroomSessionDto = {
      id: `ses_${Date.now().toString(36)}`,
      subject: dto.subject,
      grade: dto.grade,
      schoolBranchName: dto.schoolBranchName,
      teacherName: dto.teacherName,
      scheduleTime: dto.scheduleTime,
      mode: dto.mode,
      roomNumber: dto.roomNumber,
    };

    this.sessions.unshift(session);
    this.safeLog(
      { subject: session.subject, teacher: session.teacherName, branch: session.schoolBranchName },
      `Scheduled Classroom Session ${session.subject}`,
    );

    return session;
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────

  getStats(): SchoolStatsDto {
    const totalEnrolled = this.schools.reduce((sum, s) => sum + s.enrolledStudentsCount, 0);
    const sponsoredCount = this.students.filter((s) => s.sponsorshipStatus === "SPONSORED").length;
    const sponsoredPct = this.students.length > 0 ? Math.round((sponsoredCount / this.students.length) * 100) : 75;

    const avgAttendance =
      this.students.length > 0
        ? Math.round((this.students.reduce((sum, s) => sum + s.attendanceRate, 0) / this.students.length) * 10) / 10
        : 95.0;

    return {
      totalSchools: this.schools.length,
      totalStudents: totalEnrolled,
      sponsoredPercentage: sponsoredPct,
      averageAttendanceRate: avgAttendance,
    };
  }
}
