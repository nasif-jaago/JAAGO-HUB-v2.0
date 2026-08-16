"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  GraduationCap,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Building,
  Video,
  Search,
  MapPin,
  Heart,
  HeartHandshake,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { apiClient } from "@/lib/api-client";

interface SchoolBranch {
  id: string;
  code: string;
  name: string;
  district: string;
  division: string;
  headmasterName: string;
  operationalModel: "DIGITAL_ONLINE" | "PHYSICAL_CLASSROOM" | "HYBRID";
  capacity: number;
  enrolledStudentsCount: number;
  teacherCount: number;
  digitalClassroomsCount: number;
  isActive: boolean;
}

interface Student {
  id: string;
  studentId: string;
  fullName: string;
  gender: "MALE" | "FEMALE";
  grade: string;
  schoolBranchCode: string;
  schoolBranchName: string;
  guardianName: string;
  guardianPhone: string;
  enrollmentDate: string;
  sponsorshipStatus: "SPONSORED" | "UNSPONSORED" | "PENDING_SPONSOR";
  sponsorName?: string;
  attendanceRate: number;
}

interface ClassroomSession {
  id: string;
  subject: string;
  grade: string;
  schoolBranchName: string;
  teacherName: string;
  scheduleTime: string;
  mode: "DIGITAL_STUDIO" | "ON_SITE";
  roomNumber: string;
}

interface SchoolStats {
  totalSchools: number;
  totalStudents: number;
  sponsoredPercentage: number;
  averageAttendanceRate: number;
}

export default function SchoolsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"SCHOOLS" | "STUDENTS" | "SESSIONS">("SCHOOLS");
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [selectedGrade, setSelectedGrade] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isEnrollStudentOpen, setIsEnrollStudentOpen] = useState(false);
  const [isNewSchoolOpen, setIsNewSchoolOpen] = useState(false);
  const [statusNotification, setStatusNotification] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Student Enrollment Form State
  const [studentForm, setStudentForm] = useState({
    fullName: "",
    gender: "FEMALE" as Student["gender"],
    grade: "GRADE_1",
    schoolBranchCode: "SCH-RAJ-01",
    schoolBranchName: "JAAGO Rajshahi Branch School",
    guardianName: "",
    guardianPhone: "",
    sponsorshipStatus: "PENDING_SPONSOR" as Student["sponsorshipStatus"],
  });

  // School Form State
  const [schoolForm, setSchoolForm] = useState({
    code: "",
    name: "",
    district: "",
    division: "Dhaka",
    headmasterName: "",
    operationalModel: "HYBRID" as SchoolBranch["operationalModel"],
    capacity: 300,
    digitalClassroomsCount: 3,
  });

  const notify = (type: "success" | "error", msg: string) => {
    setStatusNotification({ type, msg });
    setTimeout(() => setStatusNotification(null), 4000);
  };

  // ─── Queries ───────────────────────────────────────────────────────────────

  const { data: schools = [], isLoading: isLoadingSchools } = useQuery<SchoolBranch[]>({
    queryKey: ["schools-branches"],
    queryFn: () => apiClient<SchoolBranch[]>("/v1/schools"),
  });

  const { data: students = [], isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ["schools-students", selectedBranch, selectedGrade],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedBranch !== "ALL") params.append("branch", selectedBranch);
      if (selectedGrade !== "ALL") params.append("grade", selectedGrade);
      return apiClient<Student[]>(`/v1/schools/students?${params.toString()}`);
    },
  });

  const { data: sessions = [] } = useQuery<ClassroomSession[]>({
    queryKey: ["schools-sessions"],
    queryFn: () => apiClient<ClassroomSession[]>("/v1/schools/sessions"),
  });

  const { data: stats } = useQuery<SchoolStats>({
    queryKey: ["schools-stats"],
    queryFn: () => apiClient<SchoolStats>("/v1/schools/stats"),
  });

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const enrollStudentMutation = useMutation({
    mutationFn: (dto: typeof studentForm) =>
      apiClient<Student>("/v1/schools/students", {
        method: "POST",
        body: JSON.stringify(dto),
      }),
    onSuccess: (stu) => {
      queryClient.invalidateQueries({ queryKey: ["schools-students"] });
      queryClient.invalidateQueries({ queryKey: ["schools-branches"] });
      queryClient.invalidateQueries({ queryKey: ["schools-stats"] });
      setIsEnrollStudentOpen(false);
      setStudentForm({
        fullName: "",
        gender: "FEMALE",
        grade: "GRADE_1",
        schoolBranchCode: "SCH-RAJ-01",
        schoolBranchName: "JAAGO Rajshahi Branch School",
        guardianName: "",
        guardianPhone: "",
        sponsorshipStatus: "PENDING_SPONSOR",
      });
      notify("success", `Student ${stu.fullName} enrolled successfully with ID ${stu.studentId}!`);
    },
    onError: (err) => notify("error", err.message),
  });

  const createSchoolMutation = useMutation({
    mutationFn: (dto: typeof schoolForm) =>
      apiClient<SchoolBranch>("/v1/schools", {
        method: "POST",
        body: JSON.stringify(dto),
      }),
    onSuccess: (sch) => {
      queryClient.invalidateQueries({ queryKey: ["schools-branches"] });
      queryClient.invalidateQueries({ queryKey: ["schools-stats"] });
      setIsNewSchoolOpen(false);
      setSchoolForm({
        code: "",
        name: "",
        district: "",
        division: "Dhaka",
        headmasterName: "",
        operationalModel: "HYBRID",
        capacity: 300,
        digitalClassroomsCount: 3,
      });
      notify("success", `School Branch ${sch.name} registered successfully!`);
    },
    onError: (err) => notify("error", err.message),
  });

  const filteredStudents = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.guardianName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Field Programmes & School Operations"
        subtitle="Branch schools management, student roster enrollment, and digital studio sessions."
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-semibold">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Child Education & Field Operations</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNewSchoolOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary text-foreground text-xs font-semibold border border-border/40 hover:bg-secondary/80 transition-colors"
            >
              <Building className="w-4 h-4" />
              <span>Add School Branch</span>
            </button>
            <button
              onClick={() => setIsEnrollStudentOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Enroll Student</span>
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
          <span className="text-xs text-muted-foreground">Branch Schools</span>
          <div className="text-2xl font-bold text-foreground">{stats?.totalSchools ?? schools.length}</div>
          <span className="text-[11px] text-primary font-medium">Nationwide Across BD</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <span className="text-xs text-muted-foreground">Enrolled Children</span>
          <div className="text-2xl font-bold text-foreground">
            {(stats?.totalStudents ?? 1180).toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-400 font-medium">Free Quality Education</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <span className="text-xs text-muted-foreground">Child Sponsorship</span>
          <div className="text-2xl font-bold text-foreground flex items-center gap-1.5">
            <span>{stats?.sponsoredPercentage ?? 75}%</span>
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400/20" />
          </div>
          <span className="text-[11px] text-rose-400 font-medium">Supported by Global Donors</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border space-y-1">
          <span className="text-xs text-muted-foreground">Average Attendance</span>
          <div className="text-2xl font-bold text-foreground">{stats?.averageAttendanceRate ?? 94.9}%</div>
          <span className="text-[11px] text-emerald-400 font-medium">High Engagement</span>
        </div>
      </div>

      {/* ─── TAB NAVIGATION ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 border-b border-border/40 pb-2 overflow-x-auto">
        {[
          { id: "SCHOOLS", label: "Branch Schools Directory" },
          { id: "STUDENTS", label: "Student Roster & Child Enrollment" },
          { id: "SESSIONS", label: "Classroom & Digital Studio Sessions" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── TAB 1: SCHOOLS DIRECTORY ───────────────────────────────────────── */}
      {activeTab === "SCHOOLS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoadingSchools ? (
            <div className="col-span-full p-8 text-center text-muted-foreground">Loading school branches...</div>
          ) : (
            schools.map((school) => {
              const fillPct = Math.round((school.enrolledStudentsCount / school.capacity) * 100);
              return (
                <div key={school.id} className="glass-card p-5 rounded-2xl border space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="font-mono text-[10px] text-primary font-bold">{school.code}</span>
                      <h4 className="font-bold text-foreground text-sm leading-snug">{school.name}</h4>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{school.district}, {school.division}</span>
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/15 text-primary border border-primary/30 shrink-0">
                      {school.operationalModel.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-muted-foreground">Capacity: {school.enrolledStudentsCount} / {school.capacity}</span>
                      <span className="font-bold text-foreground">{fillPct}% Full</span>
                    </div>
                    <div className="w-full bg-secondary/60 h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${fillPct}%` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/30 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Headmaster</span>
                      <span className="font-semibold text-foreground truncate block">{school.headmasterName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Teachers</span>
                      <span className="font-semibold text-foreground">{school.teacherCount} Active</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Digital Labs</span>
                      <span className="font-semibold text-primary">{school.digitalClassroomsCount} Studios</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─── TAB 2: STUDENT ROSTER ──────────────────────────────────────────── */}
      {activeTab === "STUDENTS" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search Student Name, ID, or Guardian..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
              {["ALL", "SCH-RAJ-01", "SCH-BND-02", "SCH-HBG-03", "SCH-CTG-04", "SCH-GZP-05"].map((brn) => (
                <button
                  key={brn}
                  onClick={() => setSelectedBranch(brn)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    selectedBranch === brn
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  {brn === "ALL" ? "All Branches" : brn.split("-")[1]}
                </button>
              ))}

              <div className="h-4 w-px bg-border/40 mx-1" />

              {["ALL", "GRADE_1", "GRADE_2", "GRADE_3", "GRADE_4", "GRADE_5"].map((grd) => (
                <button
                  key={grd}
                  onClick={() => setSelectedGrade(grd)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    selectedGrade === grd
                      ? "bg-secondary text-primary font-bold border border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  {grd === "ALL" ? "All Grades" : grd.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-secondary/30 text-muted-foreground font-semibold">
                    <th className="p-4">Student ID & Name</th>
                    <th className="p-4">Grade</th>
                    <th className="p-4">Branch School</th>
                    <th className="p-4">Guardian & Contact</th>
                    <th className="p-4">Sponsorship</th>
                    <th className="p-4 text-right">Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {isLoadingStudents ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Loading student roster...
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No students found.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((stu) => (
                      <tr key={stu.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="p-4">
                          <span className="font-mono font-bold text-primary block">{stu.studentId}</span>
                          <span className="font-bold text-foreground text-sm">{stu.fullName}</span>
                          <span className="text-[10px] text-muted-foreground block">{stu.gender}</span>
                        </td>

                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-secondary text-foreground text-[10px] font-semibold">
                            {stu.grade.replace("_", " ")}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className="font-semibold text-foreground block">{stu.schoolBranchName}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{stu.schoolBranchCode}</span>
                        </td>

                        <td className="p-4">
                          <span className="font-medium text-foreground block">{stu.guardianName}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{stu.guardianPhone}</span>
                        </td>

                        <td className="p-4">
                          {stu.sponsorshipStatus === "SPONSORED" ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                <Heart className="w-3 h-3 fill-rose-400/20" />
                                <span>SPONSORED</span>
                              </span>
                              {stu.sponsorName && (
                                <span className="text-[10px] text-muted-foreground block mt-0.5 truncate max-w-xs">
                                  {stu.sponsorName}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              <HeartHandshake className="w-3 h-3" />
                              <span>Needs Sponsor</span>
                            </span>
                          )}
                        </td>

                        <td className="p-4 font-mono font-bold text-right text-emerald-400">
                          {stu.attendanceRate}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: DIGITAL STUDIO SESSIONS ─────────────────────────────────── */}
      {activeTab === "SESSIONS" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sessions.map((ses) => (
              <div key={ses.id} className="glass-card p-5 rounded-2xl border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/15 text-primary border border-primary/30 flex items-center gap-1">
                    <Video className="w-3 h-3" />
                    <span>{ses.mode.replace("_", " ")}</span>
                  </span>
                  <span className="text-xs font-mono font-semibold text-muted-foreground">{ses.grade.replace("_", " ")}</span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-foreground text-sm">{ses.subject}</h4>
                  <div className="text-xs text-primary font-medium">{ses.teacherName}</div>
                  <div className="text-xs text-muted-foreground">{ses.schoolBranchName}</div>
                </div>

                <div className="pt-2 border-t border-border/30 flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span>{ses.scheduleTime}</span>
                  <span className="font-semibold text-foreground">{ses.roomNumber}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── MODAL: ENROLL STUDENT ──────────────────────────────────────────── */}
      {isEnrollStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-lg w-full p-6 rounded-2xl border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                <span>Enroll New Child / Student</span>
              </h3>
              <button onClick={() => setIsEnrollStudentOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                enrollStudentMutation.mutate(studentForm);
              }}
              className="space-y-3.5"
            >
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Student Full Name</label>
                <input
                  type="text"
                  required
                  value={studentForm.fullName}
                  onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                  placeholder="e.g. Nusrat Jahan Mim"
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Gender</label>
                  <select
                    value={studentForm.gender}
                    onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value as Student["gender"] })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="FEMALE">Female</option>
                    <option value="MALE">Male</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Academic Grade</label>
                  <select
                    value={studentForm.grade}
                    onChange={(e) => setStudentForm({ ...studentForm, grade: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="GRADE_1">Grade 1 (Primary)</option>
                    <option value="GRADE_2">Grade 2</option>
                    <option value="GRADE_3">Grade 3</option>
                    <option value="GRADE_4">Grade 4</option>
                    <option value="GRADE_5">Grade 5</option>
                    <option value="GRADE_6">Grade 6 (Secondary)</option>
                    <option value="GRADE_7">Grade 7</option>
                    <option value="GRADE_8">Grade 8</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Assigned Branch School</label>
                <select
                  value={studentForm.schoolBranchCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    const sch = schools.find((s) => s.code === code);
                    setStudentForm({
                      ...studentForm,
                      schoolBranchCode: code,
                      schoolBranchName: sch?.name || "JAAGO Rajshahi Branch School",
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  {schools.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Guardian Name</label>
                  <input
                    type="text"
                    required
                    value={studentForm.guardianName}
                    onChange={(e) => setStudentForm({ ...studentForm, guardianName: e.target.value })}
                    placeholder="e.g. Md. Jahangir Alam"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Guardian Mobile Phone</label>
                  <input
                    type="text"
                    required
                    value={studentForm.guardianPhone}
                    onChange={(e) => setStudentForm({ ...studentForm, guardianPhone: e.target.value })}
                    placeholder="+8801711223344"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEnrollStudentOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrollStudentMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary-hover transition-colors shadow-md shadow-primary/20 disabled:opacity-60"
                >
                  {enrollStudentMutation.isPending ? "Enrolling..." : "Enroll Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD SCHOOL BRANCH ───────────────────────────────────────── */}
      {isNewSchoolOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-lg w-full p-6 rounded-2xl border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" />
                <span>Register New Branch School</span>
              </h3>
              <button onClick={() => setIsNewSchoolOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createSchoolMutation.mutate(schoolForm);
              }}
              className="space-y-3.5"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">School Code</label>
                  <input
                    type="text"
                    required
                    value={schoolForm.code}
                    onChange={(e) => setSchoolForm({ ...schoolForm, code: e.target.value })}
                    placeholder="SCH-SYL-06"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Operational Model</label>
                  <select
                    value={schoolForm.operationalModel}
                    onChange={(e) => setSchoolForm({ ...schoolForm, operationalModel: e.target.value as SchoolBranch["operationalModel"] })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="HYBRID">Hybrid (Digital + On-Site)</option>
                    <option value="DIGITAL_ONLINE">Digital Online Studio</option>
                    <option value="PHYSICAL_CLASSROOM">Physical Classroom</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">School Name</label>
                <input
                  type="text"
                  required
                  value={schoolForm.name}
                  onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                  placeholder="e.g. JAAGO Sylhet Riverside School"
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">District</label>
                  <input
                    type="text"
                    required
                    value={schoolForm.district}
                    onChange={(e) => setSchoolForm({ ...schoolForm, district: e.target.value })}
                    placeholder="Sylhet"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Division</label>
                  <select
                    value={schoolForm.division}
                    onChange={(e) => setSchoolForm({ ...schoolForm, division: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="Dhaka">Dhaka</option>
                    <option value="Chittagong">Chittagong</option>
                    <option value="Rajshahi">Rajshahi</option>
                    <option value="Sylhet">Sylhet</option>
                    <option value="Khulna">Khulna</option>
                    <option value="Barisal">Barisal</option>
                    <option value="Rangpur">Rangpur</option>
                    <option value="Mymensingh">Mymensingh</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Headmaster / Principal</label>
                  <input
                    type="text"
                    required
                    value={schoolForm.headmasterName}
                    onChange={(e) => setSchoolForm({ ...schoolForm, headmasterName: e.target.value })}
                    placeholder="e.g. Mahbuba Rahman"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Student Capacity</label>
                  <input
                    type="number"
                    min="50"
                    value={schoolForm.capacity}
                    onChange={(e) => setSchoolForm({ ...schoolForm, capacity: parseInt(e.target.value, 10) || 300 })}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/40 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewSchoolOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSchoolMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary-hover transition-colors shadow-md shadow-primary/20 disabled:opacity-60"
                >
                  {createSchoolMutation.isPending ? "Saving..." : "Save School Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
