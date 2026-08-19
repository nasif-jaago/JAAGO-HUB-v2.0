export type CandidateStage =
  | "APPLIED"
  | "SHORTLISTED"
  | "INTERVIEW_SCHEDULED"
  | "OFFERED"
  | "HIRED"
  | "REJECTED";

export interface JobOpeningDto {
  id: string;
  orgId: string;
  jobTitle: string;
  departmentName: string;
  officeLocation: string;
  vacancies: number;
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACTUAL" | "VOLUNTEER";
  experienceRequired: string;
  salaryRange: string;
  status: "OPEN" | "DRAFT" | "CLOSED";
  applicantCount: number;
  postedDate: string;
  closingDate?: string | undefined;
}

export interface CreateJobOpeningDto {
  jobTitle: string;
  departmentName: string;
  officeLocation: string;
  vacancies: number;
  employmentType?: "FULL_TIME" | "PART_TIME" | "CONTRACTUAL" | "VOLUNTEER" | undefined;
  experienceRequired: string;
  salaryRange: string;
  closingDate?: string | undefined;
}

export interface CandidateDto {
  id: string;
  orgId: string;
  jobId: string;
  jobTitle: string;
  candidateName: string;
  email: string;
  phoneNumber: string;
  nidOrPassport: string;
  currentOrganization?: string | undefined;
  yearsOfExperience: number;
  stage: CandidateStage;
  interviewDate?: string | undefined;
  interviewerNotes?: string | undefined;
  resumeUrl?: string | undefined;
  appliedDate: string;
  onboardedEmployeeId?: string | undefined;
}

export interface CreateCandidateDto {
  jobId: string;
  candidateName: string;
  email: string;
  phoneNumber: string;
  nidOrPassport: string;
  currentOrganization?: string | undefined;
  yearsOfExperience: number;
  resumeUrl?: string | undefined;
}

export interface UpdateCandidateStageDto {
  stage: CandidateStage;
  interviewDate?: string | undefined;
  interviewerNotes?: string | undefined;
}

export interface OnboardCandidateDto {
  joiningDate: string;
  salaryGrade?: string | undefined;
}
