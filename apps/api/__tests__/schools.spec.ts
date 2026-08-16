import { describe, it, expect, beforeEach } from "vitest";
import { SchoolsService } from "../src/modules/schools/schools.service.js";
import { SchoolsController } from "../src/modules/schools/schools.controller.js";

describe("Field Programmes & School Operations Module", () => {
  let schoolsService: SchoolsService;
  let schoolsController: SchoolsController;

  beforeEach(() => {
    schoolsService = new SchoolsService();
    schoolsController = new SchoolsController(schoolsService);
  });

  it("lists all JAAGO branch schools and calculates operational stats", () => {
    const schools = schoolsController.getSchools();
    expect(schools.length).toBeGreaterThanOrEqual(5);

    const stats = schoolsController.getStats();
    expect(stats.totalSchools).toBeGreaterThanOrEqual(5);
    expect(stats.totalStudents).toBeGreaterThan(1000);
    expect(stats.sponsoredPercentage).toBeGreaterThan(0);
    expect(stats.averageAttendanceRate).toBeGreaterThan(80);
  });

  it("enrolls a new student with automated student ID and increments school enrollment count", () => {
    const initialEnrolled = schoolsController.getSchools().find((s) => s.code === "SCH-RAJ-01")?.enrolledStudentsCount || 0;

    const student = schoolsController.enrollStudent({
      fullName: "Nusrat Jahan Mim",
      gender: "FEMALE",
      grade: "GRADE_1",
      schoolBranchCode: "SCH-RAJ-01",
      schoolBranchName: "JAAGO Rajshahi Branch School",
      guardianName: "Md. Jahangir Alam",
      guardianPhone: "+8801755667788",
      sponsorshipStatus: "SPONSORED",
    });

    expect(student.studentId).toMatch(/^STU-RAJ-\d{4}-\d{4}$/);
    expect(student.fullName).toBe("Nusrat Jahan Mim");
    expect(student.sponsorshipStatus).toBe("SPONSORED");

    // Verify school enrollment count incremented
    const updatedEnrolled = schoolsController.getSchools().find((s) => s.code === "SCH-RAJ-01")?.enrolledStudentsCount;
    expect(updatedEnrolled).toBe(initialEnrolled + 1);
  });

  it("creates and lists digital studio classroom sessions", () => {
    const session = schoolsController.createSession({
      subject: "ICT & Digital Literacy",
      grade: "GRADE_6",
      schoolBranchName: "JAAGO Rajshahi Branch School",
      teacherName: "Arifur Rahman (Dhaka Studio)",
      scheduleTime: "01:00 PM - 01:45 PM",
      mode: "DIGITAL_STUDIO",
      roomNumber: "Studio-3",
    });

    expect(session.subject).toBe("ICT & Digital Literacy");
    expect(session.mode).toBe("DIGITAL_STUDIO");

    const sessions = schoolsController.getSessions();
    expect(sessions.some((s) => s.subject === "ICT & Digital Literacy")).toBe(true);
  });
});
