import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { getLogger } from "@jaago/logger";
import { EmployeesService } from "../hr/employees.service.js";
import type {
  JobOpeningDto,
  CreateJobOpeningDto,
  CandidateDto,
  CreateCandidateDto,
  UpdateCandidateStageDto,
  OnboardCandidateDto,
} from "./dto/recruitment.dto.js";

@Injectable()
export class RecruitmentService {
  private readonly jobs: JobOpeningDto[] = [];
  private readonly candidates: CandidateDto[] = [];

  constructor(private readonly employeesService: EmployeesService) {
    this.seedDefaultRecruitmentData();
  }

  private safeLog(meta: Record<string, unknown>, message: string): void {
    try {
      getLogger().info(meta, message);
    } catch {
      // Logger uninitialized in tests
    }
  }

  private seedDefaultRecruitmentData(): void {
    const orgId = "00000000-0000-0000-0000-000000000000";

    this.jobs.push(
      {
        id: "job_101",
        orgId,
        jobTitle: "Senior Primary Teacher — English & Science",
        departmentName: "Education & Schools",
        officeLocation: "Rajshahi School Branch",
        vacancies: 2,
        employmentType: "FULL_TIME",
        experienceRequired: "2-4 Years in Primary Education",
        salaryRange: "BDT 35,000 - 45,000",
        status: "OPEN",
        applicantCount: 3,
        postedDate: "2026-08-01",
      },
      {
        id: "job_102",
        orgId,
        jobTitle: "Procurement & Supply Chain Officer",
        departmentName: "Procurement & Supply Chain",
        officeLocation: "Dhaka HQ (Banani)",
        vacancies: 1,
        employmentType: "FULL_TIME",
        experienceRequired: "3+ Years in INGO Procurement / ERP",
        salaryRange: "BDT 45,000 - 60,000",
        status: "OPEN",
        applicantCount: 2,
        postedDate: "2026-08-05",
      },
      {
        id: "job_103",
        orgId,
        jobTitle: "Field Programme Coordinator",
        departmentName: "Field Operations",
        officeLocation: "Bandarban School Branch",
        vacancies: 1,
        employmentType: "CONTRACTUAL",
        experienceRequired: "2+ Years Community Development",
        salaryRange: "BDT 40,000 - 50,000",
        status: "OPEN",
        applicantCount: 1,
        postedDate: "2026-08-10",
      },
    );

    this.candidates.push(
      {
        id: "cand_1",
        orgId,
        jobId: "job_101",
        jobTitle: "Senior Primary Teacher — English & Science",
        candidateName: "Farhana Akter",
        email: "farhana.akter@gmail.com",
        phoneNumber: "+880 1712-888999",
        nidOrPassport: "19972692600007777",
        currentOrganization: "BRAC Primary School",
        yearsOfExperience: 3,
        stage: "INTERVIEW_SCHEDULED",
        interviewDate: "2026-08-20T10:00:00Z",
        interviewerNotes: "Strong background in interactive classroom pedagogy.",
        appliedDate: "2026-08-03",
      },
      {
        id: "cand_2",
        orgId,
        jobId: "job_101",
        jobTitle: "Senior Primary Teacher — English & Science",
        candidateName: "Mahmudul Hasan",
        email: "mahmud.hasan@yahoo.com",
        phoneNumber: "+880 1819-777666",
        nidOrPassport: "19952692600006666",
        currentOrganization: "Teach For Bangladesh",
        yearsOfExperience: 4,
        stage: "OFFERED",
        interviewerNotes: "Outstanding performance in demo lesson. Offer letter issued.",
        appliedDate: "2026-08-02",
      },
      {
        id: "cand_3",
        orgId,
        jobId: "job_102",
        jobTitle: "Procurement & Supply Chain Officer",
        candidateName: "Kazi Nabil",
        email: "kazi.nabil@gmail.com",
        phoneNumber: "+880 1913-555444",
        nidOrPassport: "19942692600005555",
        currentOrganization: "Save The Children",
        yearsOfExperience: 4,
        stage: "SHORTLISTED",
        appliedDate: "2026-08-06",
      },
    );
  }

  // ─── Job Openings ──────────────────────────────────────────────────────────

  getJobs(orgId: string): JobOpeningDto[] {
    return this.jobs.filter((j) => j.orgId === orgId);
  }

  createJob(orgId: string, dto: CreateJobOpeningDto): JobOpeningDto {
    const id = `job_${Date.now().toString(36)}`;
    const job: JobOpeningDto = {
      id,
      orgId,
      jobTitle: dto.jobTitle,
      departmentName: dto.departmentName,
      officeLocation: dto.officeLocation,
      vacancies: dto.vacancies,
      employmentType: dto.employmentType || "FULL_TIME",
      experienceRequired: dto.experienceRequired,
      salaryRange: dto.salaryRange,
      status: "OPEN",
      applicantCount: 0,
      postedDate: new Date().toISOString().split("T")[0]!,
      closingDate: dto.closingDate,
    };

    this.jobs.unshift(job);
    this.safeLog({ orgId, jobId: id, title: job.jobTitle }, `Created new job requisition: ${job.jobTitle}`);
    return job;
  }

  // ─── Candidates (ATS) ──────────────────────────────────────────────────────

  getCandidates(orgId: string, jobId?: string, stage?: string): CandidateDto[] {
    return this.candidates.filter((c) => {
      if (c.orgId !== orgId) return false;
      if (jobId && c.jobId !== jobId) return false;
      if (stage && c.stage !== stage) return false;
      return true;
    });
  }

  createCandidate(orgId: string, dto: CreateCandidateDto): CandidateDto {
    const job = this.jobs.find((j) => j.id === dto.jobId && j.orgId === orgId);
    if (!job) {
      throw new NotFoundException(`Job requisition ${dto.jobId} not found`);
    }

    const id = `cand_${Date.now().toString(36)}`;
    const candidate: CandidateDto = {
      id,
      orgId,
      jobId: dto.jobId,
      jobTitle: job.jobTitle,
      candidateName: dto.candidateName,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      nidOrPassport: dto.nidOrPassport,
      currentOrganization: dto.currentOrganization,
      yearsOfExperience: dto.yearsOfExperience,
      stage: "APPLIED",
      resumeUrl: dto.resumeUrl,
      appliedDate: new Date().toISOString().split("T")[0]!,
    };

    this.candidates.push(candidate);
    job.applicantCount += 1;

    this.safeLog({ orgId, candidateId: id, name: dto.candidateName }, `Enrolled applicant ${dto.candidateName}`);
    return candidate;
  }

  updateCandidateStage(orgId: string, candidateId: string, dto: UpdateCandidateStageDto): CandidateDto {
    const candidate = this.candidates.find((c) => c.id === candidateId && c.orgId === orgId);
    if (!candidate) {
      throw new NotFoundException(`Candidate ${candidateId} not found`);
    }

    candidate.stage = dto.stage;
    if (dto.interviewDate !== undefined) candidate.interviewDate = dto.interviewDate;
    if (dto.interviewerNotes !== undefined) candidate.interviewerNotes = dto.interviewerNotes;

    this.safeLog({ orgId, candidateId, stage: dto.stage }, `Updated candidate ${candidate.candidateName} stage to ${dto.stage}`);
    return candidate;
  }

  onboardCandidate(orgId: string, candidateId: string, dto: OnboardCandidateDto) {
    const candidate = this.candidates.find((c) => c.id === candidateId && c.orgId === orgId);
    if (!candidate) {
      throw new NotFoundException(`Candidate ${candidateId} not found`);
    }

    if (candidate.onboardedEmployeeId) {
      throw new BadRequestException(`Candidate is already onboarded as employee ${candidate.onboardedEmployeeId}`);
    }

    const job = this.jobs.find((j) => j.id === candidate.jobId);
    const [firstName = candidate.candidateName, lastName = ""] = candidate.candidateName.split(" ");

    // Automatically enroll in Employee Master Directory
    const employee = this.employeesService.createEmployee(orgId, {
      firstName,
      lastName: lastName || "Staff",
      officialEmail: `${candidate.candidateName.toLowerCase().replace(/\s+/g, ".")}@jaago.com.bd`,
      personalEmail: candidate.email,
      phoneNumber: candidate.phoneNumber,
      nidOrPassport: candidate.nidOrPassport,
      joiningDate: dto.joiningDate,
      departmentName: job?.departmentName || "Education & Schools",
      officeName: job?.officeLocation || "Dhaka HQ",
      designation: job?.jobTitle || "Staff Member",
      salaryGrade: dto.salaryGrade || "Grade-5",
    });

    candidate.stage = "HIRED";
    candidate.onboardedEmployeeId = employee.id;

    this.safeLog(
      { orgId, candidateId, employeeId: employee.id, employeeCode: employee.employeeCode },
      `Successfully onboarded candidate ${candidate.candidateName} as ${employee.employeeCode}`,
    );

    return {
      success: true,
      candidate,
      employee,
    };
  }

  getStats(orgId: string) {
    const orgJobs = this.jobs.filter((j) => j.orgId === orgId);
    const orgCandidates = this.candidates.filter((c) => c.orgId === orgId);

    return {
      openPositions: orgJobs.filter((j) => j.status === "OPEN").length,
      totalApplicants: orgCandidates.length,
      interviewsScheduled: orgCandidates.filter((c) => c.stage === "INTERVIEW_SCHEDULED").length,
      hiredCount: orgCandidates.filter((c) => c.stage === "HIRED").length,
    };
  }
}
