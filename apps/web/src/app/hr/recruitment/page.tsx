"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  UserCheck,
  Building,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Mail,
  Phone,
  Sparkles,
  Users,
  GraduationCap,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { apiClient } from "@/lib/api-client";

interface JobOpening {
  id: string;
  jobTitle: string;
  departmentName: string;
  officeLocation: string;
  vacancies: number;
  employmentType: string;
  experienceRequired: string;
  salaryRange: string;
  status: "OPEN" | "DRAFT" | "CLOSED";
  applicantCount: number;
  postedDate: string;
}

interface Candidate {
  id: string;
  jobId: string;
  jobTitle: string;
  candidateName: string;
  email: string;
  phoneNumber: string;
  nidOrPassport: string;
  currentOrganization?: string;
  yearsOfExperience: number;
  stage: "APPLIED" | "SHORTLISTED" | "INTERVIEW_SCHEDULED" | "OFFERED" | "HIRED" | "REJECTED";
  interviewDate?: string;
  interviewerNotes?: string;
  appliedDate: string;
  onboardedEmployeeId?: string;
}

interface RecruitmentStats {
  openPositions: number;
  totalApplicants: number;
  interviewsScheduled: number;
  hiredCount: number;
}

export default function RecruitmentPage() {
  const queryClient = useQueryClient();
  const [selectedStage, setSelectedStage] = useState<string>("ALL");
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
  const [onboardCandidateTarget, setOnboardCandidateTarget] = useState<Candidate | null>(null);
  const [onboardJoiningDate, setOnboardJoiningDate] = useState<string>("2026-08-16");
  const [statusNotification, setStatusNotification] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // New Job Form
  const [jobFormData, setJobFormData] = useState({
    jobTitle: "",
    departmentName: "Education & Schools",
    officeLocation: "Rajshahi School Branch",
    vacancies: 1,
    employmentType: "FULL_TIME",
    experienceRequired: "2+ Years Experience",
    salaryRange: "BDT 35,000 - 45,000",
  });

  // New Candidate Form
  const [candFormData, setCandFormData] = useState({
    jobId: "job_101",
    candidateName: "",
    email: "",
    phoneNumber: "+880 ",
    nidOrPassport: "",
    currentOrganization: "",
    yearsOfExperience: 2,
  });

  const notify = (type: "success" | "error", msg: string) => {
    setStatusNotification({ type, msg });
    setTimeout(() => setStatusNotification(null), 4000);
  };

  // ─── Queries ───────────────────────────────────────────────────────────────

  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery<JobOpening[]>({
    queryKey: ["recruitment-jobs"],
    queryFn: () => apiClient<JobOpening[]>("/v1/recruitment/jobs"),
  });

  const { data: candidates = [], isLoading: isLoadingCandidates } = useQuery<Candidate[]>({
    queryKey: ["recruitment-candidates", selectedStage],
    queryFn: () => {
      const url = selectedStage === "ALL" ? "/v1/recruitment/candidates" : `/v1/recruitment/candidates?stage=${selectedStage}`;
      return apiClient<Candidate[]>(url);
    },
  });

  const { data: stats } = useQuery<RecruitmentStats>({
    queryKey: ["recruitment-stats"],
    queryFn: () => apiClient<RecruitmentStats>("/v1/recruitment/stats"),
  });

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const createJobMutation = useMutation({
    mutationFn: (dto: typeof jobFormData) =>
      apiClient<JobOpening>("/v1/recruitment/jobs", {
        method: "POST",
        body: JSON.stringify(dto),
      }),
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: ["recruitment-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["recruitment-stats"] });
      setIsPostJobOpen(false);
      setJobFormData({
        jobTitle: "",
        departmentName: "Education & Schools",
        officeLocation: "Rajshahi School Branch",
        vacancies: 1,
        employmentType: "FULL_TIME",
        experienceRequired: "2+ Years Experience",
        salaryRange: "BDT 35,000 - 45,000",
      });
      notify("success", `Job position '${job.jobTitle}' posted successfully!`);
    },
    onError: (err) => notify("error", err.message),
  });

  const createCandidateMutation = useMutation({
    mutationFn: (dto: typeof candFormData) =>
      apiClient<Candidate>("/v1/recruitment/candidates", {
        method: "POST",
        body: JSON.stringify(dto),
      }),
    onSuccess: (cand) => {
      queryClient.invalidateQueries({ queryKey: ["recruitment-candidates"] });
      queryClient.invalidateQueries({ queryKey: ["recruitment-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["recruitment-stats"] });
      setIsAddCandidateOpen(false);
      setCandFormData({
        jobId: "job_101",
        candidateName: "",
        email: "",
        phoneNumber: "+880 ",
        nidOrPassport: "",
        currentOrganization: "",
        yearsOfExperience: 2,
      });
      notify("success", `Application registered for ${cand.candidateName}!`);
    },
    onError: (err) => notify("error", err.message),
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: Candidate["stage"] }) =>
      apiClient<Candidate>(`/v1/recruitment/candidates/${id}/stage`, {
        method: "PATCH",
        body: JSON.stringify({ stage }),
      }),
    onSuccess: (cand) => {
      queryClient.invalidateQueries({ queryKey: ["recruitment-candidates"] });
      queryClient.invalidateQueries({ queryKey: ["recruitment-stats"] });
      notify("success", `Candidate ${cand.candidateName} moved to ${cand.stage}!`);
    },
    onError: (err) => notify("error", err.message),
  });

  const onboardMutation = useMutation({
    mutationFn: ({ candidateId, joiningDate }: { candidateId: string; joiningDate: string }) =>
      apiClient<{ success: boolean; employee: { employeeCode: string; fullName: string } }>(
        `/v1/recruitment/candidates/${candidateId}/onboard`,
        {
          method: "POST",
          body: JSON.stringify({ joiningDate, salaryGrade: "Grade-5" }),
        },
      ),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["recruitment-candidates"] });
      queryClient.invalidateQueries({ queryKey: ["recruitment-stats"] });
      queryClient.invalidateQueries({ queryKey: ["employees-list"] });
      queryClient.invalidateQueries({ queryKey: ["employees-stats"] });
      setOnboardCandidateTarget(null);
      notify("success", `🎉 ${res.employee.fullName} successfully enrolled into Employee Master (${res.employee.employeeCode})!`);
    },
    onError: (err) => notify("error", err.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recruitment & Applicant Tracking (ATS)"
        subtitle="Manage job requisitions, candidate screening pipelines, and automated employee onboarding."
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-semibold">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Talent Acquisition</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddCandidateOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary text-foreground text-xs font-semibold border border-border/40 hover:bg-secondary/80 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Candidate</span>
            </button>
            <button
              onClick={() => setIsPostJobOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
            >
              <Briefcase className="w-4 h-4" />
              <span>Post Job Opening</span>
            </button>
          </div>
        }
      />

      {/* Notification Toast */}
      {statusNotification && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium transition-all ${
            statusNotification.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
              : "bg-destructive/15 border border-destructive/30 text-destructive"
          }`}
        >
          {statusNotification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{statusNotification.msg}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <span className="text-xs text-muted-foreground">Active Requisitions</span>
          <div className="text-2xl font-bold text-foreground">{stats?.openPositions ?? jobs.length}</div>
          <span className="text-[11px] text-primary font-medium">Open Vacancies</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <span className="text-xs text-muted-foreground">Applicants in Pipeline</span>
          <div className="text-2xl font-bold text-foreground">{stats?.totalApplicants ?? candidates.length}</div>
          <span className="text-[11px] text-emerald-400 font-medium">Across all stages</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <span className="text-xs text-muted-foreground">Interviews Scheduled</span>
          <div className="text-2xl font-bold text-foreground">{stats?.interviewsScheduled ?? 1}</div>
          <span className="text-[11px] text-amber-400 font-medium">This Week</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <span className="text-xs text-muted-foreground">Hired & Onboarded</span>
          <div className="text-2xl font-bold text-foreground">{stats?.hiredCount ?? 0}</div>
          <span className="text-[11px] text-muted-foreground">Enrolled Staff</span>
        </div>
      </div>

      {/* ─── ACTIVE JOB OPENINGS SECTION ───────────────────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-primary" />
          <span>Active Job Openings & Vacancies</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isLoadingJobs ? (
            <div className="col-span-3 glass-card p-8 text-center text-xs text-muted-foreground">
              Loading open positions...
            </div>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="glass-card p-5 rounded-2xl border space-y-3 hover:border-primary/40 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {job.vacancies} Vacanc{job.vacancies > 1 ? "ies" : "y"}
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">{job.employmentType}</span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-foreground text-sm">{job.jobTitle}</h4>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Building className="w-3 h-3 text-primary" />
                      <span>{job.departmentName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-primary" />
                      <span>{job.officeLocation}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/30 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-mono text-[11px]">{job.salaryRange}</span>
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold text-[11px]">
                    {job.applicantCount} Applicants
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── ATS CANDIDATE PIPELINE TABLE ──────────────────────────────────── */}
      <div className="space-y-3 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span>Applicant Pipeline & Screening</span>
          </h3>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: "ALL", label: "All Candidates" },
              { id: "APPLIED", label: "Applied" },
              { id: "SHORTLISTED", label: "Shortlisted" },
              { id: "INTERVIEW_SCHEDULED", label: "Interview" },
              { id: "OFFERED", label: "Offered" },
              { id: "HIRED", label: "Hired" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedStage(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedStage === tab.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/30 text-muted-foreground font-semibold">
                  <th className="p-4">Candidate</th>
                  <th className="p-4">Applied Position</th>
                  <th className="p-4">Experience & Background</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Pipeline Stage</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {isLoadingCandidates ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Loading candidates...
                    </td>
                  </tr>
                ) : candidates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No candidates in this stage.
                    </td>
                  </tr>
                ) : (
                  candidates.map((cand) => (
                    <tr key={cand.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-foreground text-sm">{cand.candidateName}</div>
                        <span className="text-[10px] text-muted-foreground">Applied {cand.appliedDate}</span>
                      </td>

                      <td className="p-4">
                        <span className="font-medium text-foreground">{cand.jobTitle}</span>
                      </td>

                      <td className="p-4 space-y-0.5">
                        <div className="text-foreground">{cand.yearsOfExperience} Years Exp</div>
                        <span className="text-[11px] text-muted-foreground block">{cand.currentOrganization || "Fresher"}</span>
                      </td>

                      <td className="p-4 space-y-0.5">
                        <div className="flex items-center gap-1 text-[11px] text-foreground">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <span>{cand.email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          <span>{cand.phoneNumber}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <select
                          value={cand.stage}
                          onChange={(e) =>
                            updateStageMutation.mutate({
                              id: cand.id,
                              stage: e.target.value as Candidate["stage"],
                            })
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                            cand.stage === "HIRED"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : cand.stage === "OFFERED"
                              ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                              : cand.stage === "INTERVIEW_SCHEDULED"
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                              : "bg-secondary text-foreground border-border/40"
                          }`}
                        >
                          <option value="APPLIED">Applied</option>
                          <option value="SHORTLISTED">Shortlisted</option>
                          <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                          <option value="OFFERED">Offered</option>
                          <option value="HIRED">Hired</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      </td>

                      <td className="p-4 text-right">
                        {cand.stage === "OFFERED" || cand.stage === "HIRED" ? (
                          cand.onboardedEmployeeId ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Enrolled</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => setOnboardCandidateTarget(cand)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-colors"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Onboard to Staff</span>
                            </button>
                          )
                        ) : (
                          <span className="text-muted-foreground text-[11px]">In Review</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── MODAL: ONBOARD CANDIDATE ───────────────────────────────────────── */}
      {onboardCandidateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span>Onboard Candidate into Staff</span>
              </h3>
              <button onClick={() => setOnboardCandidateTarget(null)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/40 text-xs space-y-1">
              <div className="font-bold text-foreground">{onboardCandidateTarget.candidateName}</div>
              <div className="text-muted-foreground">Position: {onboardCandidateTarget.jobTitle}</div>
              <div className="text-muted-foreground">Email: {onboardCandidateTarget.email}</div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onboardMutation.mutate({
                  candidateId: onboardCandidateTarget.id,
                  joiningDate: onboardJoiningDate,
                });
              }}
              className="space-y-3.5"
            >
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Official Joining Date</label>
                <input
                  type="date"
                  required
                  value={onboardJoiningDate}
                  onChange={(e) => setOnboardJoiningDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-[11px] text-primary space-y-1">
                <p className="font-semibold">Automated Employee Master Enrollment:</p>
                <p className="text-muted-foreground">
                  Upon confirmation, a new sequential employee ID (EMP-XXXX) will be generated, the employee master profile will be enrolled in the directory, and a welcome login invitation will be dispatched.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setOnboardCandidateTarget(null)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={onboardMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-60"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{onboardMutation.isPending ? "Enrolling..." : "Confirm & Enroll Staff"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: POST JOB OPENING ────────────────────────────────────────── */}
      {isPostJobOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-lg w-full p-6 rounded-2xl border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                <span>Post New Job Requisition</span>
              </h3>
              <button onClick={() => setIsPostJobOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createJobMutation.mutate(jobFormData);
              }}
              className="space-y-3.5"
            >
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Job Title</label>
                <input
                  type="text"
                  required
                  value={jobFormData.jobTitle}
                  onChange={(e) => setJobFormData({ ...jobFormData, jobTitle: e.target.value })}
                  placeholder="e.g. Senior ICT & Robotics Teacher"
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Department</label>
                  <select
                    value={jobFormData.departmentName}
                    onChange={(e) => setJobFormData({ ...jobFormData, departmentName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="Education & Schools">Education & Schools</option>
                    <option value="Finance & Accounts">Finance & Accounts</option>
                    <option value="Procurement & Supply Chain">Procurement & Supply Chain</option>
                    <option value="Field Operations">Field Operations</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Branch Office</label>
                  <select
                    value={jobFormData.officeLocation}
                    onChange={(e) => setJobFormData({ ...jobFormData, officeLocation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="Dhaka HQ (Banani)">Dhaka HQ (Banani)</option>
                    <option value="Rajshahi School Branch">Rajshahi School Branch</option>
                    <option value="Chittagong School Branch">Chittagong School Branch</option>
                    <option value="Habiganj School Branch">Habiganj School Branch</option>
                    <option value="Bandarban School Branch">Bandarban School Branch</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Vacancies</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={jobFormData.vacancies}
                    onChange={(e) => setJobFormData({ ...jobFormData, vacancies: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Salary Range</label>
                  <input
                    type="text"
                    required
                    value={jobFormData.salaryRange}
                    onChange={(e) => setJobFormData({ ...jobFormData, salaryRange: e.target.value })}
                    placeholder="BDT 35,000 - 45,000"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPostJobOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createJobMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary-hover transition-colors shadow-md shadow-primary/20 disabled:opacity-60"
                >
                  {createJobMutation.isPending ? "Posting..." : "Post Requisition"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD CANDIDATE ───────────────────────────────────────────── */}
      {isAddCandidateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-lg w-full p-6 rounded-2xl border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                <span>Register Candidate Application</span>
              </h3>
              <button onClick={() => setIsAddCandidateOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createCandidateMutation.mutate(candFormData);
              }}
              className="space-y-3.5"
            >
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Target Opening Position</label>
                <select
                  value={candFormData.jobId}
                  onChange={(e) => setCandFormData({ ...candFormData, jobId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.jobTitle} ({j.officeLocation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Candidate Full Name</label>
                  <input
                    type="text"
                    required
                    value={candFormData.candidateName}
                    onChange={(e) => setCandFormData({ ...candFormData, candidateName: e.target.value })}
                    placeholder="e.g. Asif Mahmud"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Email</label>
                  <input
                    type="email"
                    required
                    value={candFormData.email}
                    onChange={(e) => setCandFormData({ ...candFormData, email: e.target.value })}
                    placeholder="asif.mahmud@gmail.com"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={candFormData.phoneNumber}
                    onChange={(e) => setCandFormData({ ...candFormData, phoneNumber: e.target.value })}
                    placeholder="+880 1711-000000"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">NID / Passport</label>
                  <input
                    type="text"
                    required
                    value={candFormData.nidOrPassport}
                    onChange={(e) => setCandFormData({ ...candFormData, nidOrPassport: e.target.value })}
                    placeholder="19962692600008888"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddCandidateOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCandidateMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary-hover transition-colors shadow-md shadow-primary/20 disabled:opacity-60"
                >
                  {createCandidateMutation.isPending ? "Registering..." : "Add Applicant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
