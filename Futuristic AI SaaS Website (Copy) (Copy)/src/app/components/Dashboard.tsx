import { motion, AnimatePresence } from "motion/react";
import React, { useState, useRef, useCallback } from "react";

import {
  Upload,
  Target,
  Sparkles,
  CircleCheck,
  TriangleAlert,
  User,
  GraduationCap,
  FileText,
  Lightbulb,
  AlertCircle,
  X,
  CheckCircle2,
  Lock,
  Sparkle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import axios from "axios";

import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type EducationLevel = {
  level?: "10th" | "12th" | "Diploma" | "Undergraduate" | "Postgraduate";
  institution?: string;
  board?: string;
  degree?: string;
  gpa?: string;
  percentage?: string;
  year?: string;
};

type Experience = {
  role: string;
  company: string;
  location?: string;
  duration: string;
  bullets: string;
};

type Project = {
  title: string;
  technologies: string;
  description: string;
};

type FormState = {
  full_name: string;
  role: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  education: {
    tenth: EducationLevel;
    twelfthOrDiploma: EducationLevel;
    degree: EducationLevel;
  };
  skills: {
    technical: string;
    soft: string;
  };
  experience: {
    role: string;
    company: string;
    location: string;
    duration: string;
    bullets: string;
  }[];
  projects: {
    title: string;
    technologies: string;
    description: string;
  }[];
  certifications: string;
};

type OptimizedResume = {
  header: {
    name: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
  };
  summary: string;
  skills: {
    technical: string[];
    soft: string[];
  };
  experience: any[];
  projects: any[];
  education: any[];
  certifications_awards: string[];
};

type SuggestedProject = {
  title: string;
  bullets: string[];
};

// Doc 6: typed AtsResult
type AtsResult = {
  overall: number;
  breakdown: {
    contact: number;
    sections: number;
    keywords: number;
    readability: number;
    formatting: number;
  };
  missing: string[];
};

type ValidationErrors = {
  full_name?: boolean;
  role?: boolean;
  email?: boolean;
  technical?: boolean;
  tenth_institution?: boolean;
  tenth_board?: boolean;
  tenth_percentage?: boolean;
  tenth_year?: boolean;
  twelfth_institution?: boolean;
  twelfth_board?: boolean;
  twelfth_percentage?: boolean;
  twelfth_year?: boolean;
};

type FieldFormatErrors = Record<string, string>;

type ResumeTemplate = "standard" | "modern" | "minimal";

// ─────────────────────────────────────────────
// Validation helpers
// ─────────────────────────────────────────────
const validateEmail = (val: string): string | null => {
  if (!val.trim()) return null;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(val) ? null : "Enter a valid email address";
};

const validatePhone = (val: string): string | null => {
  if (!val.trim()) return null;
  const digits = val.replace(/[\s\-()]/g, "");
  if (!/^\d+$/.test(digits)) return "Phone must contain only digits";
  if (digits.length !== 10) return "Phone number must be exactly 10 digits";
  return null;
};

const validateURL = (val: string, label: string): string | null => {
  if (!val.trim()) return null;
  try {
    const url = new URL(val.startsWith("http") ? val : "https://" + val);
    if (!url.hostname.includes(".")) throw new Error();
    return null;
  } catch {
    return `Enter a valid ${label} URL`;
  }
};

const validatePercentage = (val: string): string | null => {
  if (!val.trim()) return null;
  const num = parseFloat(val);
  if (isNaN(num)) return "Must be a number";
  if (num < 0 || num > 100) return "Percentage must be between 0 and 100";
  return null;
};

const validateGPA = (val: string): string | null => {
  if (!val.trim()) return null;
  const num = parseFloat(val);
  if (isNaN(num)) return "Must be a number";
  if (num < 0 || num > 10) return "GPA / CGPA must be between 0 and 10";
  return null;
};

const validateYear = (val: string): string | null => {
  if (!val.trim()) return null;
  const num = parseInt(val, 10);
  if (isNaN(num)) return "Must be a valid year";
  if (num < 1950 || num > 2030) return "Year must be between 1950 and 2030";
  return null;
};

// ─────────────────────────────────────────────
// ATS constants (Doc 5 values preserved)
// ─────────────────────────────────────────────
const ATS_MAX = {
  contact: 10,
  sections: 15,
  keywords: 25,
  readability: 15,
  formatting: 10,
};

const toPercent = (value?: number, max?: number) => {
  if (!value || !max) return 0;
  return Math.round((value / max) * 100);
};

// ─────────────────────────────────────────────
// Spinner helper (Doc 5)
// ─────────────────────────────────────────────
const Spinner = ({ size = "h-5 w-5" }: { size?: string }) => (
  <svg className={`animate-spin ${size}`} viewBox="0 0 24 24">
    <circle
      className="opacity-25"
      cx="12" cy="12" r="10"
      stroke="currentColor" strokeWidth="4" fill="none"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

// ─────────────────────────────────────────────
// ScoreCard sub-component (Doc 6)
// ─────────────────────────────────────────────
type ScoreCardProps = {
  label: string;
  atsResult: AtsResult | null;
  variant: "before" | "after";
  animate?: boolean;
};

const ScoreCard = ({ label, atsResult, variant, animate }: ScoreCardProps) => {
  const score = atsResult?.overall ?? 0;
  const gradientId = `gradient-${variant}-ats`;
  const color =
    variant === "before"
      ? { from: "#6b7280", to: "#9ca3af" }
      : { from: "#8b5cf6", to: "#06b6d4" };

  const barData = [{ name: "ATS Score", value: score }];

  const breakdown = [
    { label: "Keywords",  value: toPercent(atsResult?.breakdown?.keywords, ATS_MAX.keywords),    color: variant === "before" ? "#6b7280" : "#22c55e" },
    { label: "Format",    value: toPercent(atsResult?.breakdown?.formatting, ATS_MAX.formatting), color: variant === "before" ? "#6b7280" : "#06b6d4" },
    { label: "Sections",  value: toPercent(atsResult?.breakdown?.sections, ATS_MAX.sections),     color: variant === "before" ? "#6b7280" : "#8b5cf6" },
    { label: "Contact",   value: toPercent(atsResult?.breakdown?.contact, ATS_MAX.contact),       color: variant === "before" ? "#6b7280" : "#f59e0b" },
  ];

  return (
    <motion.div
      initial={animate ? { opacity: 0, scale: 0.94, x: 16 } : false}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`flex-1 p-5 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border relative overflow-hidden ${
        variant === "before"
          ? "border-white/10"
          : "border-violet-500/30 shadow-lg shadow-violet-500/10"
      }`}
    >
      {variant === "after" && atsResult && (
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-violet-500/10 blur-2xl pointer-events-none" />
      )}

      <div className="flex items-center justify-between mb-4">
        <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
          variant === "before"
            ? "border-white/10 bg-white/5 text-gray-400"
            : "border-violet-500/40 bg-violet-500/10 text-violet-300"
        }`}>
          {label}
        </span>
        {variant === "after" && atsResult && (
          <CircleCheck className="w-4 h-4 text-green-400" />
        )}
      </div>

      <div className="flex items-center justify-center mb-4">
        <div className="relative w-32 h-32">
          <RadialBarChart
            width={128} height={128} cx={64} cy={64}
            innerRadius={50} outerRadius={64}
            data={barData} startAngle={90} endAngle={-270}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={color.from} />
                <stop offset="100%" stopColor={color.to} />
              </linearGradient>
            </defs>
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar background dataKey="value" cornerRadius={8} fill={`url(#${gradientId})`} />
          </RadialBarChart>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-2xl font-bold bg-gradient-to-r ${
                variant === "before" ? "from-gray-400 to-gray-300" : "from-violet-400 to-cyan-400"
              } bg-clip-text text-transparent`}>
                {atsResult ? `${score}%` : "--"}
              </div>
              <div className="text-[9px] text-muted-foreground mt-0.5">ATS Score</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {breakdown.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className="text-muted-foreground">{item.label}</span>
              <span style={{ color: item.color }}>{item.value}%</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={animate ? { width: 0 } : false}
                animate={{ width: `${item.value}%` }}
                transition={{ duration: 0.9, ease: "easeOut", delay: 0.3 }}
                className="h-full rounded-full"
                style={{ backgroundColor: item.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────
// Delta badge (Doc 6)
// ─────────────────────────────────────────────
const DeltaBadge = ({ before, after }: { before: AtsResult | null; after: AtsResult | null }) => {
  if (!before || !after) return null;
  const delta = after.overall - before.overall;

  return (
    <div className="flex flex-col items-center justify-center gap-3 px-1 shrink-0">
      <motion.div
        initial={{ scale: 0, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.2 }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border ${
          delta > 0
            ? "bg-green-500/10 border-green-500/30 text-green-400"
            : delta < 0
              ? "bg-red-500/10 border-red-500/30 text-red-400"
              : "bg-white/5 border-white/10 text-muted-foreground"
        }`}
      >
        {delta > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : delta < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
        {delta > 0 ? "+" : ""}{delta}%
      </motion.div>
      <ArrowRight className="w-4 h-4 text-white/20" />
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Dashboard component
// ─────────────────────────────────────────────
export function Dashboard() {
  // ── Auth (Doc 5) ──
  const { user } = useAuth();
  const { openLogin } = useAuthModal();

  // ── Full state reset (Doc 6) ──
  const resetAllResumeState = () => {
    setGeneratedResume(null);
    setPdfUrl(null);
    setExpPdfUrl(null);
    setAtsResult(null);
    setAfterAtsResult(null);
    setAiSuggestions([]);
    setProjectSuggestions([]);
    setCertificationSuggestions([]);
    setSummaryOptions([]);
    setSelectedSummary(null);
    setShowSummaryChooser(false);
  };

  // ── UI state ──
  const [userType, setUserType] = useState<"experienced" | "beginner">("experienced");
  const [higherEducation, setHigherEducation] = useState<"class12" | "diploma">("class12");

  // Doc 6: summary chooser state
  const [summaryOptions, setSummaryOptions] = useState<string[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<string | null>(null);
  const [showSummaryChooser, setShowSummaryChooser] = useState(false);

  // Doc 6: template selection
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate>("standard");

  const [generatedResume, setGeneratedResume] = useState<OptimizedResume | null>(null);
  const [loading, setLoading] = useState(false);
  const [useAI, setUseAI] = useState(true);

  const [resumeFile, setResumeFile] = useState<File | null>(null);

  // Doc 6: before + after ATS scores
  const [atsResult, setAtsResult] = useState<AtsResult | null>(null);
  const [afterAtsResult, setAfterAtsResult] = useState<AtsResult | null>(null);

  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [projectSuggestions, setProjectSuggestions] = useState<SuggestedProject[]>([]);
  const [certificationSuggestions, setCertificationSuggestions] = useState<any[]>([]);

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [expPdfUrl, setExpPdfUrl] = useState<string | null>(null);
  const [optimising, setOptimising] = useState(false);

  const [jobDescription, setJobDescription] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [showErrors, setShowErrors] = useState(false);
  const [formatErrors, setFormatErrors] = useState<FieldFormatErrors>({});

  const [form, setForm] = useState<FormState>({
    full_name: "",
    role: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    education: { tenth: {}, twelfthOrDiploma: {}, degree: {} },
    skills: { technical: "", soft: "" },
    experience: [],
    projects: [],
    certifications: "",
  });

  // ── Derived display flags (Doc 6) ──
  const showComparison = userType === "experienced" && atsResult !== null && afterAtsResult !== null;
  const showSingleAts  = userType === "experienced" && atsResult !== null && afterAtsResult === null;

  // ─────────────────────────────────────────────
  // Auth token helper (Doc 5)
  // ─────────────────────────────────────────────
  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    if (!user) return {};
    try {
      const token = await user.getIdToken();
      return { Authorization: `Bearer ${token}` };
    } catch {
      return {};
    }
  };

  // ─────────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────────
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    if (userType === "beginner") {
      if (!form.full_name.trim())  errors.full_name = true;
      if (!form.role.trim())       errors.role = true;
      if (!form.email.trim())      errors.email = true;
      if (!form.skills.technical.trim()) errors.technical = true;
      // Class 10 — all fields mandatory (Doc 5)
      if (!form.education.tenth.institution?.trim()) errors.tenth_institution = true;
      if (!form.education.tenth.board?.trim())       errors.tenth_board = true;
      if (!form.education.tenth.percentage?.trim())  errors.tenth_percentage = true;
      if (!form.education.tenth.year?.trim())        errors.tenth_year = true;
    }
    setValidationErrors(errors);
    setShowErrors(true);
    return Object.keys(errors).length === 0;
  };

  const runFormatValidation = useCallback((next: FormState) => {
    const errs: FieldFormatErrors = {};
    const e  = validateEmail(next.email);                                       if (e)  errs["email"] = e;
    const p  = validatePhone(next.phone);                                       if (p)  errs["phone"] = p;
    const li = validateURL(next.linkedin, "LinkedIn");                         if (li) errs["linkedin"] = li;
    const gh = validateURL(next.github, "GitHub");                             if (gh) errs["github"] = gh;
    const p10 = validatePercentage(next.education.tenth.percentage || "");     if (p10) errs["tenth.percentage"] = p10;
    const y10 = validateYear(next.education.tenth.year || "");                 if (y10) errs["tenth.year"] = y10;
    const p12 = validatePercentage(next.education.twelfthOrDiploma.percentage || ""); if (p12) errs["twelfthOrDiploma.percentage"] = p12;
    const y12 = validateYear(next.education.twelfthOrDiploma.year || "");      if (y12) errs["twelfthOrDiploma.year"] = y12;
    const gpa = validateGPA(next.education.degree.gpa || "");                  if (gpa) errs["degree.gpa"] = gpa;
    const yd  = validateYear(next.education.degree.year || "");                if (yd)  errs["degree.year"] = yd;
    setFormatErrors(errs);
  }, []);

  // ─────────────────────────────────────────────
  // Experience / Project CRUD
  // ─────────────────────────────────────────────
  const addExperience = () =>
    setForm((prev) => ({
      ...prev,
      experience: [...prev.experience, { role: "", company: "", location: "", duration: "", bullets: "" }],
    }));

  const removeExperience = (index: number) =>
    setForm((prev) => ({ ...prev, experience: prev.experience.filter((_, i) => i !== index) }));

  const updateExperience = (index: number, field: keyof Experience, value: string) =>
    setForm((prev) => ({
      ...prev,
      experience: prev.experience.map((exp, i) => (i === index ? { ...exp, [field]: value } : exp)),
    }));

  const addProject = () =>
    setForm((prev) => ({
      ...prev,
      projects: [...prev.projects, { title: "", technologies: "", description: "" }],
    }));

  const removeProject = (index: number) =>
    setForm((prev) => ({ ...prev, projects: prev.projects.filter((_, i) => i !== index) }));

  const updateProject = (index: number, field: keyof Project, value: string) =>
    setForm((prev) => ({
      ...prev,
      projects: prev.projects.map((proj, i) => (i === index ? { ...proj, [field]: value } : proj)),
    }));

  // ─────────────────────────────────────────────
  // Payload builder (Doc 6 — cleaner extraction)
  // ─────────────────────────────────────────────
  const buildPayload = () => {
    const educationArray: EducationLevel[] = [];
    if (form.education.tenth?.institution)
      educationArray.push({ level: "10th", institution: form.education.tenth.institution, board: form.education.tenth.board, percentage: form.education.tenth.percentage, year: form.education.tenth.year });
    if (form.education.twelfthOrDiploma?.institution)
      educationArray.push({ level: higherEducation === "class12" ? "12th" : "Diploma", institution: form.education.twelfthOrDiploma.institution, board: form.education.twelfthOrDiploma.board, percentage: form.education.twelfthOrDiploma.percentage, year: form.education.twelfthOrDiploma.year });
    if (form.education.degree?.institution)
      educationArray.push({ level: "Undergraduate", institution: form.education.degree.institution, degree: form.education.degree.degree, gpa: form.education.degree.gpa, year: form.education.degree.year });

    const experienceArray = form.experience
      .filter((exp) => exp.role && exp.company && exp.duration)
      .map((exp) => ({
        role: exp.role,
        company: exp.company,
        location: exp.location || undefined,
        duration: exp.duration,
        bullets: exp.bullets ? exp.bullets.split("\n").filter((l) => l.trim()) : [],
      }));

    const projectsArray = form.projects
      .filter((p) => p.title?.trim())
      .map((p) => ({
        title: p.title.trim(),
        technologies: p.technologies ? p.technologies.split(",").map((t) => t.trim()).filter((t) => t) : [],
        description: p.description ? p.description.split("\n").map((l) => l.trim()).filter((l) => l) : [],
      }));

    const certificationsArray = form.certifications
      ? form.certifications.split("\n").map((c) => c.trim()).filter((c) => c)
      : [];

    return {
      full_name: form.full_name,
      role: form.role,
      email: form.email,
      phone: form.phone || undefined,
      location: form.location || undefined,
      linkedin: form.linkedin || undefined,
      github: form.github || undefined,
      skills: form.skills.technical.split(",").map((s) => s.trim()).filter((s) => s),
      softSkills: form.skills.soft ? form.skills.soft.split(",").map((s) => s.trim()).filter((s) => s) : undefined,
      experience: experienceArray.length > 0 ? experienceArray : undefined,
      projects: projectsArray.length > 0 ? projectsArray : undefined,
      education: educationArray,
      certifications: certificationsArray.length > 0 ? certificationsArray : undefined,
      useAI,
      jobDescription: jobDescription || undefined,
      summary: selectedSummary || undefined, // Doc 6: pass chosen summary to API
    };
  };

  // ─────────────────────────────────────────────
  // PDF helpers (Doc 5 auth headers + Doc 6 template support)
  // ─────────────────────────────────────────────
  const downloadPDF = async () => {
    if (!user) { openLogin(); return; }     // Doc 5: auth gate
    if (!generatedResume) return;
    const resumeToExport = selectedSummary
      ? { ...generatedResume, summary: selectedSummary }
      : generatedResume;

    try {
      const authHeaders = await getAuthHeaders();
      const res = await axios.post(
        "http://localhost:4000/api/public/export-pdf",
        { optimizedResume: resumeToExport, template: selectedTemplate },
        { responseType: "blob", headers: authHeaders },
      );
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${selectedTemplate}_resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("PDF download failed:", error);
      alert("Failed to download PDF. Please try again.");
    }
  };

  const generateAndPreviewPDF = async (
    resumeData: OptimizedResume,
    template: ResumeTemplate,
    setter: (u: string | null) => void,
  ) => {
    if (!resumeData?.header?.name) return;
    try {
      const authHeaders = await getAuthHeaders();
      const response = await axios.post(
        "http://localhost:4000/api/public/export-pdf",
        { optimizedResume: resumeData, template },
        { responseType: "blob", headers: authHeaders },
      );
      const blob = new Blob([response.data], { type: "application/pdf" });
      setter(URL.createObjectURL(blob));
    } catch (error) {
      console.error("PDF preview failed:", error);
    }
  };

  // ─────────────────────────────────────────────
  // Generate Resume / Analyze Match
  //
  // Experienced: single API call → set atsResult, resume, PDF
  // Beginner 2-step (Doc 6):
  //   Click 1 (no summary yet) → fetch summaryOptions, show chooser, STOP
  //   User picks a summary → only setSelectedSummary, no API
  //   Click 2 (summary set) → POST create-resume, generate PDF
  // ─────────────────────────────────────────────
  const handleGenerateResume = async () => {
    try {
      setLoading(true);

      // ── Experienced path ──────────────────────────────────────────────
      if (userType === "experienced") {
        if (!resumeFile) { alert("Please upload your resume first"); return; }
        const authHeaders = await getAuthHeaders();
        const formData = new FormData();
        formData.append("resume", resumeFile);
        const res = await axios.post(
          "http://localhost:4000/api/public/analyze",
          formData,
          { headers: { "Content-Type": "multipart/form-data", ...authHeaders } },
        );
        const { optimizedResume, atsScore, analysis } = res.data;
        setGeneratedResume(optimizedResume || null);
        setAtsResult(atsScore || null);
        setAfterAtsResult(null);
        setExpPdfUrl(null);
        setCertificationSuggestions(res.data.certificationSuggestions || []);
        setAiSuggestions(
          analysis?.weaknesses && Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [],
        );
        if (res.data.summaryOptions?.length) {
          setSummaryOptions(res.data.summaryOptions);
          setSelectedSummary(res.data.summaryOptions[0]);
        }
        return;
      }

      // ── Beginner path ─────────────────────────────────────────────────
      if (Object.keys(formatErrors).length > 0) {
        alert("Please fix the highlighted errors before generating your resume.");
        return;
      }
      if (!validateForm()) return;

      const payload = buildPayload();

      // STEP 1: No summary chosen yet → fetch options, show chooser, stop.
      if (!selectedSummary) {
        const authHeaders = await getAuthHeaders();
        const summaryRes = await axios.post(
          "http://localhost:4000/api/public/summaries",
          {
            useAI,
            role: form.role,
            skills: payload.skills,
            experienceCount: payload.experience?.length || 0,
            education: payload.education,
          },
          { headers: authHeaders },
        );
        setSummaryOptions(summaryRes.data.summaries);
        setShowSummaryChooser(true);
        return; // ⛔ Stop — wait for user to pick a summary
      }

      // STEP 2: Summary chosen → create the resume
      const authHeaders = await getAuthHeaders();
      const res = await axios.post(
        "http://localhost:4000/api/public/create-resume",
        payload,
        { headers: authHeaders },
      );
      const { optimizedResume } = res.data;
      const resumeWithSummary = { ...optimizedResume, summary: selectedSummary };

      setGeneratedResume(resumeWithSummary);
      setProjectSuggestions(res.data.projectSuggestions || []);
      setCertificationSuggestions(res.data.certificationsRecommended || []);

      if (resumeWithSummary?.header?.name) {
        await generateAndPreviewPDF(resumeWithSummary, selectedTemplate, setPdfUrl);
      }

      setSummaryOptions([]);
      setShowSummaryChooser(false);
      setValidationErrors({});
      setShowErrors(false);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) { openLogin(); return; }
        alert(err.response?.data?.message || "Backend error while processing resume.");
      } else {
        alert("Unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // Optimise Resume — stores AFTER ATS score (Doc 6)
  // ─────────────────────────────────────────────
  const handleOptimiseResume = async () => {
    if (!resumeFile) { alert("Please upload your resume first"); return; }
    try {
      setOptimising(true);
      const authHeaders = await getAuthHeaders();
      const formData = new FormData();
      formData.append("resume", resumeFile);
      if (jobDescription.trim()) formData.append("jobDescription", jobDescription.trim());

      const res = await axios.post(
        "http://localhost:4000/api/public/analyze",
        formData,
        { headers: { "Content-Type": "multipart/form-data", ...authHeaders } },
      );
      const { optimizedResume, atsScore } = res.data;
      setGeneratedResume(optimizedResume || null);
      if (atsScore) setAfterAtsResult(atsScore); // Doc 6: populates comparison view
      if (optimizedResume?.header?.name) {
        await generateAndPreviewPDF(optimizedResume, selectedTemplate, setExpPdfUrl);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) { openLogin(); return; }
        alert(err.response?.data?.message || "Failed to optimise resume.");
      } else {
        alert("Unexpected error. Please try again.");
      }
    } finally {
      setOptimising(false);
    }
  };

  // ─────────────────────────────────────────────
  // Form helpers
  // ─────────────────────────────────────────────
  const handleChange = (path: (string | number)[], value: string) => {
    // Doc 6: reset summary picker if role or skills change
    if (path[0] === "role" || path[0] === "skills") {
      setSelectedSummary(null);
      setSummaryOptions([]);
      setShowSummaryChooser(false);
    }
    setForm((prev) => {
      const updated = structuredClone(prev);
      let ref: any = updated;
      path.forEach((key, index) => {
        if (index === path.length - 1) ref[key] = value;
        else { ref[key] = ref[key] ?? {}; ref = ref[key]; }
      });
      runFormatValidation(updated);
      return updated;
    });
    if (showErrors) {
      const fieldName = path[path.length - 1] as keyof ValidationErrors;
      if (validationErrors[fieldName])
        setValidationErrors((prev) => ({ ...prev, [fieldName]: false }));
    }
  };

  const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && /\.(pdf|doc|docx)$/i.test(file.name)) setResumeFile(file);
    else alert("Please upload a PDF, DOC, or DOCX file.");
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setResumeFile(e.target.files[0]);
  };

  const getInputClassName = (fieldName: keyof ValidationErrors, base: string) => {
    const hasError = showErrors && validationErrors[fieldName];
    return `${base} ${hasError ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-violet-500/50"}`;
  };

  const fmtBorder = (key: string) =>
    formatErrors[key] ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-violet-500/50";

  const FmtError = ({ id }: { id: string }) =>
    formatErrors[id] ? (
      <p className="text-xs text-red-400 mt-1 ml-1 flex items-center gap-1">
        <TriangleAlert className="w-3 h-3" /> {formatErrors[id]}
      </p>
    ) : null;

  // ─────────────────────────────────────────────
  // Certifications Section
  // Rich card from Doc 5: org, description, level badge, skills tags
  // ─────────────────────────────────────────────
  const CertificationsSection = () => (
    <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Sparkle className="w-5 h-5 text-amber-400" />
        Recommended Certifications
      </h3>
      <div className="space-y-4">
        {certificationSuggestions.length > 0 ? (
          certificationSuggestions.map((cert: any, i) => (
            <div
              key={i}
              className="p-5 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-amber-500/30 transition-all"
            >
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{cert.name}</p>

                  {(cert.organization || cert.provider) && (
                    <p className="text-xs text-violet-400 mt-1.5 font-medium">
                      {cert.organization || cert.provider}
                    </p>
                  )}

                  {cert.description && (
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      {cert.description}
                    </p>
                  )}

                  {cert.level && (
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        cert.level === "Beginner"
                          ? "bg-green-500/20 text-green-300 border border-green-500/30"
                          : cert.level === "Intermediate"
                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      }`}>
                        {cert.level}
                      </span>
                    </div>
                  )}

                  {cert.skills && cert.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {cert.skills.map((skill: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-muted-foreground">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {!cert.description && cert.why && (
                    <p className="text-xs text-muted-foreground mt-2">{cert.why}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            {userType === "experienced"
              ? "Analyze your resume to see recommended certifications!"
              : "Generate your resume to see recommended certifications!"}
          </p>
        )}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <section
      id="dashboard"
      className="relative py-24 bg-gradient-to-b from-background via-violet-500/5 to-background"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl mb-4">
            <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
              Smart Dashboard
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Analyze your resume, get insights, and discover opportunities in one powerful interface
          </p>

          {/* Doc 5: Not-logged-in soft banner */}
          {!user && (
            <div className="inline-flex items-center gap-3 mt-6 px-5 py-2.5 rounded-full bg-amber-500/10 border border-amber-500/30">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-sm text-amber-400">Login to download your generated resume</p>
              <button
                onClick={openLogin}
                className="px-3 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs transition-colors"
              >
                Login
              </button>
            </div>
          )}

          {/* User type selector */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className="text-sm text-muted-foreground">Candidate Type:</span>
            <div className="inline-flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
              <button
                onClick={() => { resetAllResumeState(); setUserType("experienced"); }}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  userType === "experienced"
                    ? "bg-gradient-to-r from-violet-500 to-cyan-500 text-white"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                <User className="w-4 h-4 inline mr-1.5" />
                Experienced
              </button>
              <button
                onClick={() => { resetAllResumeState(); setUserType("beginner"); }}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  userType === "beginner"
                    ? "bg-gradient-to-r from-violet-500 to-cyan-500 text-white"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                <GraduationCap className="w-4 h-4 inline mr-1.5" />
                Beginner / Fresher
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Main grid ── */}
        <div className="grid lg:grid-cols-3 gap-8">

          {/* ════════════════════════════════
              LEFT PANEL
          ════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-1 space-y-6"
          >

            {/* ── EXPERIENCED: Upload card ── */}
            {userType === "experienced" ? (
              <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm">
                <h3 className="text-xl mb-1 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-violet-400" />
                  Upload Resume
                </h3>
                <p className="text-xs text-muted-foreground mb-4">Supports PDF, DOC, and DOCX formats</p>

                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileSelect} />

                {!resumeFile ? (
                  <div
                    onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300 p-8 flex flex-col items-center justify-center text-center ${
                      isDragging
                        ? "border-violet-400 bg-violet-500/10 scale-[1.02] shadow-lg shadow-violet-500/20"
                        : "border-white/15 hover:border-violet-500/50 hover:bg-white/[0.03] bg-black/20"
                    }`}
                  >
                    <div className={`relative mb-4 transition-all duration-300 ${isDragging ? "scale-110" : ""}`}>
                      <div className={`absolute inset-0 rounded-full blur-lg transition-opacity duration-300 ${isDragging ? "opacity-100 bg-violet-500/30" : "opacity-0"}`} />
                      <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${isDragging ? "bg-violet-500/20 border border-violet-500/40" : "bg-white/5 border border-white/10"}`}>
                        <Upload className={`w-7 h-7 transition-colors duration-300 ${isDragging ? "text-violet-300" : "text-muted-foreground"}`} />
                      </div>
                    </div>
                    <p className={`text-sm font-medium transition-colors duration-300 ${isDragging ? "text-violet-300" : "text-white/80"}`}>
                      {isDragging ? "Drop your resume here" : "Drag & drop your resume"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                    <div className="flex items-center gap-2 mt-4">
                      {["PDF", "DOC", "DOCX"].map((fmt) => (
                        <span key={fmt} className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-white/5 border border-white/10 text-muted-foreground">
                          {fmt}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-green-500/20 bg-green-500/[0.06] p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{resumeFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(resumeFile.size / 1024).toFixed(1)} KB • {resumeFile.name.split(".").pop()?.toUpperCase()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/25">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-xs text-green-400 font-medium">Ready</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setResumeFile(null)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-3 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      Replace file
                    </button>
                  </div>
                )}
              </div>
            ) : (

              /* ── BEGINNER: Your Details form ── */
              <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm">
                <h3 className="text-xl mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-violet-400" />
                  Your Details
                </h3>

                {showErrors && Object.keys(validationErrors).length > 0 && (
                  <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-red-400 font-medium mb-1">Please fill in all required fields</p>
                        <p className="text-xs text-red-400/80">Required fields are marked with an asterisk (*)</p>
                      </div>
                    </div>
                  </div>
                )}

                {Object.keys(formatErrors).length > 0 && (
                  <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
                    <TriangleAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-400">Please fix the highlighted fields before continuing</p>
                  </div>
                )}

                <div className="max-h-[700px] overflow-y-auto scrollbar-thin scrollbar-thumb-violet-500/50 scrollbar-track-white/5 pr-2">
                  <div className="space-y-6">

                    {/* Personal Information */}
                    <div>
                      <label className="block text-sm text-muted-foreground mb-3">Personal Information</label>
                      <div className="space-y-3">
                        <div>
                          <input type="text" placeholder="Full Name *"
                            className={getInputClassName("full_name", "w-full px-4 py-3 rounded-xl bg-white/5 outline-none text-sm border")}
                            value={form.full_name} onChange={(e) => handleChange(["full_name"], e.target.value)} />
                          {showErrors && validationErrors.full_name && (
                            <p className="text-xs text-red-400 mt-1 ml-1">Full name is required</p>
                          )}
                        </div>
                        <div>
                          <input type="text" placeholder="Role / Desired Job Title * (e.g., Frontend Developer)"
                            className={getInputClassName("role", "w-full px-4 py-3 rounded-xl bg-white/5 outline-none text-sm border")}
                            value={form.role} onChange={(e) => handleChange(["role"], e.target.value)} />
                          {showErrors && validationErrors.role && (
                            <p className="text-xs text-red-400 mt-1 ml-1">Role is required</p>
                          )}
                        </div>
                        <div>
                          <input type="text" placeholder="Email Address *"
                            className={`w-full px-4 py-3 rounded-xl bg-white/5 outline-none text-sm border ${(showErrors && validationErrors.email) || formatErrors["email"] ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-violet-500/50"}`}
                            value={form.email} onChange={(e) => handleChange(["email"], e.target.value)} />
                          {showErrors && validationErrors.email && !formatErrors["email"] && (
                            <p className="text-xs text-red-400 mt-1 ml-1">Email is required</p>
                          )}
                          <FmtError id="email" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <input type="text" placeholder="Phone Number (Optional)"
                              className={`w-full px-4 py-3 rounded-xl bg-white/5 outline-none text-sm border ${fmtBorder("phone")}`}
                              value={form.phone} onChange={(e) => handleChange(["phone"], e.target.value)} />
                            <FmtError id="phone" />
                          </div>
                          <input type="text" placeholder="Location (Optional)"
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                            value={form.location} onChange={(e) => handleChange(["location"], e.target.value)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <input type="text" placeholder="LinkedIn Profile URL (Optional)"
                              className={`w-full px-4 py-3 rounded-xl bg-white/5 outline-none text-sm border ${fmtBorder("linkedin")}`}
                              value={form.linkedin} onChange={(e) => handleChange(["linkedin"], e.target.value)} />
                            <FmtError id="linkedin" />
                          </div>
                          <div>
                            <input type="text" placeholder="GitHub Profile URL (Optional)"
                              className={`w-full px-4 py-3 rounded-xl bg-white/5 outline-none text-sm border ${fmtBorder("github")}`}
                              value={form.github} onChange={(e) => handleChange(["github"], e.target.value)} />
                            <FmtError id="github" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Education */}
                    <div>
                      <label className="block text-sm text-muted-foreground mb-2">Education</label>

                      {/* Class 10 — required (Doc 5 asterisks) */}
                      <div className="space-y-3 mb-4">
                        <p className="text-xs text-muted-foreground">Class 10 (SSC) *</p>
                        <div>
                          <input type="text" placeholder="School Name *"
                            className={`w-full px-4 py-3 rounded-xl bg-white/5 outline-none text-sm border ${showErrors && validationErrors.tenth_institution ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-violet-500/50"}`}
                            onChange={(e) => handleChange(["education", "tenth", "institution"], e.target.value)} />
                          {showErrors && validationErrors.tenth_institution && (
                            <p className="text-xs text-red-400 mt-1 ml-1">School name is required</p>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <input type="text" placeholder="Board *"
                              className={`w-full px-4 py-3 rounded-xl bg-white/5 outline-none text-sm border ${showErrors && validationErrors.tenth_board ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-violet-500/50"}`}
                              onChange={(e) => handleChange(["education", "tenth", "board"], e.target.value)} />
                            {showErrors && validationErrors.tenth_board && <p className="text-xs text-red-400 mt-1 ml-1">Required</p>}
                          </div>
                          <div>
                            <input type="text" placeholder="Year *"
                              className={`w-full px-4 py-3 rounded-xl bg-white/5 outline-none text-sm border ${(showErrors && validationErrors.tenth_year) || formatErrors["tenth.year"] ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-violet-500/50"}`}
                              onChange={(e) => handleChange(["education", "tenth", "year"], e.target.value)} />
                            {showErrors && validationErrors.tenth_year && !formatErrors["tenth.year"] && <p className="text-xs text-red-400 mt-1 ml-1">Required</p>}
                            <FmtError id="tenth.year" />
                          </div>
                          <div>
                            <input type="text" placeholder="Marks % *"
                              className={`w-full px-4 py-3 rounded-xl bg-white/5 outline-none text-sm border ${(showErrors && validationErrors.tenth_percentage) || formatErrors["tenth.percentage"] ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-violet-500/50"}`}
                              onChange={(e) => handleChange(["education", "tenth", "percentage"], e.target.value)} />
                            {showErrors && validationErrors.tenth_percentage && !formatErrors["tenth.percentage"] && <p className="text-xs text-red-400 mt-1 ml-1">Required</p>}
                            <FmtError id="tenth.percentage" />
                          </div>
                        </div>
                      </div>

                      {/* Class 12 / Diploma */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-4">
                          {(["class12", "diploma"] as const).map((opt) => (
                            <button key={opt} type="button" onClick={() => setHigherEducation(opt)}
                              className={`px-4 py-2 rounded-xl text-xs transition-all ${higherEducation === opt ? "bg-violet-500/20 border border-violet-500/50 text-violet-400" : "bg-white/5 border border-white/10 text-muted-foreground"}`}>
                              {opt === "class12" ? "Class 12" : "Diploma"}
                            </button>
                          ))}
                        </div>
                        <input type="text"
                          placeholder={higherEducation === "class12" ? "School Name" : "College / Institute Name"}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                          onChange={(e) => handleChange(["education", "twelfthOrDiploma", "institution"], e.target.value)} />
                        <input type="text"
                          placeholder={higherEducation === "class12" ? "Board (e.g., CBSE, State Board)" : "Board / University"}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                          onChange={(e) => handleChange(["education", "twelfthOrDiploma", "board"], e.target.value)} />
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <input type="text" placeholder="Year"
                              className={`w-full px-4 py-3 rounded-xl bg-white/5 outline-none text-sm border ${fmtBorder("twelfthOrDiploma.year")}`}
                              onChange={(e) => handleChange(["education", "twelfthOrDiploma", "year"], e.target.value)} />
                            <FmtError id="twelfthOrDiploma.year" />
                          </div>
                          <div>
                            <input type="text" placeholder="Percentage"
                              className={`w-full px-4 py-3 rounded-xl bg-white/5 outline-none text-sm border ${fmtBorder("twelfthOrDiploma.percentage")}`}
                              onChange={(e) => handleChange(["education", "twelfthOrDiploma", "percentage"], e.target.value)} />
                            <FmtError id="twelfthOrDiploma.percentage" />
                          </div>
                        </div>
                      </div>

                      {/* Degree */}
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground">Engineering / Degree (Optional)</p>
                        <input type="text" placeholder="College / University Name"
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                          onChange={(e) => handleChange(["education", "degree", "institution"], e.target.value)} />
                        <input type="text" placeholder="Degree Name (e.g., B.Tech, BCA, B.Sc)"
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                          onChange={(e) => handleChange(["education", "degree", "degree"], e.target.value)} />
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <input type="text" placeholder="Year"
                              className={`w-full px-4 py-3 rounded-xl bg-white/5 outline-none text-sm border ${fmtBorder("degree.year")}`}
                              onChange={(e) => handleChange(["education", "degree", "year"], e.target.value)} />
                            <FmtError id="degree.year" />
                          </div>
                          <div>
                            <input type="text" placeholder="GPA / CGPA"
                              className={`w-full px-4 py-3 rounded-xl bg-white/5 outline-none text-sm border ${fmtBorder("degree.gpa")}`}
                              onChange={(e) => handleChange(["education", "degree", "gpa"], e.target.value)} />
                            <FmtError id="degree.gpa" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Skills */}
                    <div>
                      <label className="block text-sm text-muted-foreground mb-3">Skills</label>
                      <div className="space-y-3">
                        <div>
                          <input type="text" placeholder="Technical Skills * (comma separated, e.g., React, Node.js, Python)"
                            className={getInputClassName("technical", "w-full px-4 py-3 rounded-xl bg-white/5 outline-none text-sm border")}
                            value={form.skills.technical} onChange={(e) => handleChange(["skills", "technical"], e.target.value)} />
                          {showErrors && validationErrors.technical && (
                            <p className="text-xs text-red-400 mt-1 ml-1">At least one technical skill is required</p>
                          )}
                        </div>
                        <input type="text" placeholder="Soft Skills (Optional, comma separated)"
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                          value={form.skills.soft} onChange={(e) => handleChange(["skills", "soft"], e.target.value)} />
                      </div>
                    </div>

                    {/* Experience */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm text-muted-foreground">Experience (Optional)</label>
                        <button type="button" onClick={addExperience}
                          className="px-3 py-1 rounded-lg bg-violet-500/20 border border-violet-500/50 text-violet-400 text-xs hover:bg-violet-500/30 transition-all">
                          + Add Experience
                        </button>
                      </div>
                      {form.experience.map((exp, index) => (
                        <div key={index} className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-violet-400">Experience {index + 1}</span>
                            <button type="button" onClick={() => removeExperience(index)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                          </div>
                          <div className="space-y-3">
                            <input type="text" placeholder="Job Title" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm" value={exp.role} onChange={(e) => updateExperience(index, "role", e.target.value)} />
                            <input type="text" placeholder="Company Name" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm" value={exp.company} onChange={(e) => updateExperience(index, "company", e.target.value)} />
                            <div className="grid grid-cols-2 gap-3">
                              <input type="text" placeholder="Location (Optional)" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm" value={exp.location} onChange={(e) => updateExperience(index, "location", e.target.value)} />
                              <input type="text" placeholder="Dates (e.g., Jan 2023 - Present)" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm" value={exp.duration} onChange={(e) => updateExperience(index, "duration", e.target.value)} />
                            </div>
                            <textarea placeholder="Description (one bullet point per line)" className="w-full h-24 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none resize-none text-sm" value={exp.bullets} onChange={(e) => updateExperience(index, "bullets", e.target.value)} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Projects */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm text-muted-foreground">Projects (Optional)</label>
                        <button type="button" onClick={addProject}
                          className="px-3 py-1 rounded-lg bg-violet-500/20 border border-violet-500/50 text-violet-400 text-xs hover:bg-violet-500/30 transition-all">
                          + Add Project
                        </button>
                      </div>
                      {form.projects.map((proj, index) => (
                        <div key={index} className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-cyan-400">Project {index + 1}</span>
                            <button type="button" onClick={() => removeProject(index)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                          </div>
                          <div className="space-y-3">
                            <input type="text" placeholder="Project Title" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm" value={proj.title} onChange={(e) => updateProject(index, "title", e.target.value)} />
                            <input type="text" placeholder="Technologies Used (comma separated)" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm" value={proj.technologies} onChange={(e) => updateProject(index, "technologies", e.target.value)} />
                            <textarea placeholder="Description (one bullet point per line)" className="w-full h-24 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none resize-none text-sm" value={proj.description} onChange={(e) => updateProject(index, "description", e.target.value)} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Certifications */}
                    <div>
                      <label className="block text-sm text-muted-foreground mb-3">Certifications (Optional)</label>
                      <textarea
                        placeholder="List your certifications (one per line)"
                        className="w-full h-24 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none resize-none text-sm"
                        value={form.certifications}
                        onChange={(e) => handleChange(["certifications"], e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Job Description card ── */}
            <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm">
              <h3 className="text-xl mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400" />
                Job Description {userType === "beginner" && "(Optional)"}
              </h3>
              <textarea
                placeholder="Paste the job description here..."
                className="w-full h-40 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none resize-none text-sm"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />

              {/* Primary action */}
              <button
                className="w-full mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 hover:shadow-lg hover:shadow-violet-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleGenerateResume}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner />
                    {userType === "experienced" ? "Analyzing..." : "Generating..."}
                  </span>
                ) : userType === "experienced" ? "Analyze Match" : "Generate Resume"}
              </button>

              {/* Optimise button — experienced only */}
              {userType === "experienced" && (
                <button
                  className="w-full mt-3 px-6 py-3 rounded-xl border border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20 hover:border-violet-500/60 hover:shadow-md hover:shadow-violet-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-violet-300"
                  onClick={handleOptimiseResume}
                  disabled={optimising || !resumeFile}
                >
                  {optimising ? (
                    <><Spinner size="h-4 w-4" /> Optimising…</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Optimise Resume</>
                  )}
                </button>
              )}
            </div>
          </motion.div>

          {/* ════════════════════════════════
              RIGHT PANEL
          ════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >

            {/* ── ATS Score card (Experienced only) ── */}
            {userType === "experienced" && (
              <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl mb-1">ATS Compatibility Score</h3>
                    <p className="text-sm text-muted-foreground">
                      {showComparison
                        ? "Before and after AI optimisation — side by side"
                        : "Your resume's compatibility with Applicant Tracking Systems"}
                    </p>
                  </div>
                  {showComparison && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-400">Optimised</span>
                    </div>
                  )}
                  {showSingleAts && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30">
                      <CircleCheck className="w-4 h-4 text-violet-400" />
                      <span className="text-sm text-violet-300">Analyzed</span>
                    </div>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {showComparison ? (
                    /* Before / After comparison (Doc 6) */
                    <motion.div key="comparison" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                      <div className="flex items-stretch gap-2 mb-6">
                        <ScoreCard label="Before" atsResult={atsResult} variant="before" />
                        <DeltaBadge before={atsResult} after={afterAtsResult} />
                        <ScoreCard label="After" atsResult={afterAtsResult} variant="after" animate />
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { label: "Keywords", bk: "keywords",   max: ATS_MAX.keywords,   color: "#22c55e" },
                          { label: "Format",   bk: "formatting", max: ATS_MAX.formatting, color: "#06b6d4" },
                          { label: "Sections", bk: "sections",   max: ATS_MAX.sections,   color: "#8b5cf6" },
                          { label: "Contact",  bk: "contact",    max: ATS_MAX.contact,    color: "#f59e0b" },
                        ].map(({ label, bk, max, color }) => {
                          const beforeVal = toPercent((atsResult?.breakdown as any)?.[bk], max);
                          const afterVal  = toPercent((afterAtsResult?.breakdown as any)?.[bk], max);
                          const delta = afterVal - beforeVal;
                          return (
                            <div key={label} className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                              <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
                              <p className="text-lg font-bold" style={{ color }}>{afterVal}%</p>
                              <p className={`text-[10px] font-medium mt-0.5 ${delta > 0 ? "text-green-400" : delta < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                                {delta > 0 ? `↑ +${delta}%` : delta < 0 ? `↓ ${delta}%` : "—"}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  ) : (
                    /* Single ATS view */
                    <motion.div key="single" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex items-center justify-center">
                          <div className="relative w-48 h-48">
                            <RadialBarChart
                              width={192} height={192} cx={96} cy={96}
                              innerRadius={76} outerRadius={96}
                              data={[{ name: "ATS Score", value: atsResult?.overall ?? 0 }]}
                              startAngle={90} endAngle={-270}
                            >
                              <defs>
                                <linearGradient id="gradientATS" x1="0" y1="0" x2="1" y2="1">
                                  <stop offset="0%" stopColor="#8b5cf6" />
                                  <stop offset="100%" stopColor="#06b6d4" />
                                </linearGradient>
                              </defs>
                              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                              <RadialBar background dataKey="value" cornerRadius={10} fill="url(#gradientATS)" />
                            </RadialBarChart>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <div className="text-4xl bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                                  {atsResult?.overall ?? "--"}%
                                </div>
                                <div className="text-xs text-muted-foreground">ATS Score</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {[
                            { label: "Keyword Match",     value: toPercent(atsResult?.breakdown?.keywords, ATS_MAX.keywords),       colorClass: "text-green-400",  barClass: "from-green-500 to-emerald-500" },
                            { label: "Format Score",      value: toPercent(atsResult?.breakdown?.formatting, ATS_MAX.formatting),   colorClass: "text-cyan-400",   barClass: "from-cyan-500 to-blue-500" },
                            { label: "Experience Match",  value: toPercent(atsResult?.breakdown?.readability, ATS_MAX.readability), colorClass: "text-violet-400", barClass: "from-violet-500 to-purple-500" },
                          ].map((item) => (
                            <div key={item.label} className="p-4 rounded-xl bg-white/5 border border-white/10">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-muted-foreground">{item.label}</span>
                                <span className={item.colorClass}>{item.value}%</span>
                              </div>
                              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className={`h-full bg-gradient-to-r ${item.barClass} rounded-full transition-all`} style={{ width: `${item.value}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground text-center mt-4">
                        Contact Info: {toPercent(atsResult?.breakdown?.contact, ATS_MAX.contact)}% •{" "}
                        Sections: {toPercent(atsResult?.breakdown?.sections, ATS_MAX.sections)}%
                      </p>
                      {atsResult && (
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                          className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-violet-500/[0.07] border border-violet-500/20">
                          <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
                          <p className="text-xs text-violet-300">
                            Click <span className="font-semibold">Optimise Resume</span> to see a before vs. after comparison.
                          </p>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ── Experienced: Optimised Resume Preview ── */}
            {userType === "experienced" && (
              <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl mb-2 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-violet-400" />
                      Optimised Resume
                    </h3>
                    <p className="text-sm text-muted-foreground">AI-optimised version of your uploaded resume</p>
                  </div>
                  {expPdfUrl && (
                    <button
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 hover:shadow-lg hover:shadow-violet-500/50 transition-all text-sm flex items-center gap-2"
                      onClick={downloadPDF}
                    >
                      {!user && <Lock className="w-4 h-4" />}
                      Download PDF
                    </button>
                  )}
                </div>

                {/* Template switcher (Doc 6) */}
                {generatedResume && !optimising && (
                  <div className="flex gap-3 mb-4">
                    {(["standard", "modern", "minimal"] as const).map((t) => (
                      <button key={t}
                        onClick={async () => {
                          if (expPdfUrl) { URL.revokeObjectURL(expPdfUrl); setExpPdfUrl(null); }
                          setSelectedTemplate(t);
                          await generateAndPreviewPDF(generatedResume, t, setExpPdfUrl);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs transition-all border ${selectedTemplate === t ? "bg-violet-500/20 border-violet-500/60 text-violet-300" : "bg-white/5 border-white/10 text-muted-foreground"}`}>
                        {t.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}

                {optimising ? (
                  <div className="h-[350px] flex items-center justify-center rounded-xl border border-white/10 bg-black/20">
                    <div className="text-center">
                      <Spinner size="h-12 w-12" />
                      <p className="text-sm text-muted-foreground mt-4">Optimising your resume…</p>
                    </div>
                  </div>
                ) : expPdfUrl ? (
                  <div className="relative h-[350px] overflow-hidden rounded-xl border border-white/10 bg-black">
                    <iframe key={selectedTemplate}
                      src={`${expPdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                      className={`w-full h-[600px] border-0 pointer-events-none transition-all duration-300 ${!user ? "blur-sm" : ""}`}
                      scrolling="no" />
                    {/* Doc 5: Login overlay */}
                    {!user && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
                        <div className="text-center p-8 rounded-2xl bg-background/90 border border-white/10 max-w-xs mx-4">
                          <Lock className="w-10 h-10 mx-auto mb-3 text-violet-400" />
                          <h3 className="text-lg font-semibold mb-2">Login to Download</h3>
                          <p className="text-sm text-muted-foreground mb-5">Create a free account to download your resume</p>
                          <button onClick={openLogin}
                            className="w-full px-6 py-2.5 rounded-lg bg-gradient-to-r from-violet-500 to-cyan-500 hover:shadow-lg hover:shadow-violet-500/50 transition-all text-sm font-medium">
                            Login Now
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-[350px] flex items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/20">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Click <span className="text-violet-400 font-medium">Optimise Resume</span> to generate an AI-enhanced version
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Beginner: Resume Preview ── */}
            {userType === "beginner" && (
              <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl mb-2 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-violet-400" />
                      View Your Resume
                    </h3>
                    <p className="text-sm text-muted-foreground">AI-generated resume based on your details</p>
                  </div>
                  {pdfUrl && (
                    <button
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 hover:shadow-lg hover:shadow-violet-500/50 transition-all text-sm flex items-center gap-2"
                      onClick={downloadPDF}
                    >
                      {!user && <Lock className="w-4 h-4" />}
                      Download PDF
                    </button>
                  )}
                </div>

                {/* Template switcher (Doc 6) */}
                {generatedResume && !loading && (
                  <div className="flex gap-3 mb-4">
                    {(["standard", "modern", "minimal"] as const).map((t) => (
                      <button key={t}
                        onClick={async () => {
                          if (pdfUrl) { URL.revokeObjectURL(pdfUrl); setPdfUrl(null); }
                          setSelectedTemplate(t);
                          await generateAndPreviewPDF(generatedResume, t, setPdfUrl);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs transition-all border ${selectedTemplate === t ? "bg-violet-500/20 border-violet-500/60 text-violet-300" : "bg-white/5 border-white/10 text-muted-foreground"}`}>
                        {t.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}

                {loading ? (
                  <div className="h-[350px] flex items-center justify-center rounded-xl border border-white/10 bg-black/20">
                    <div className="text-center">
                      <Spinner size="h-12 w-12" />
                      <p className="text-sm text-muted-foreground mt-4">Generating your resume...</p>
                    </div>
                  </div>
                ) : pdfUrl ? (
                  <div className="relative h-[350px] overflow-hidden rounded-xl border border-white/10 bg-black">
                    <iframe key={selectedTemplate}
                      src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                      className={`w-full h-[600px] border-0 pointer-events-none transition-all duration-300 ${!user ? "blur-sm" : ""}`}
                      scrolling="no" />
                    {/* Doc 5: Login overlay */}
                    {!user && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
                        <div className="text-center p-8 rounded-2xl bg-background/90 border border-white/10 max-w-xs mx-4">
                          <Lock className="w-10 h-10 mx-auto mb-3 text-violet-400" />
                          <h3 className="text-lg font-semibold mb-2">Login to Download</h3>
                          <p className="text-sm text-muted-foreground mb-5">Create a free account to download your resume</p>
                          <button onClick={openLogin}
                            className="w-full px-6 py-2.5 rounded-lg bg-gradient-to-r from-violet-500 to-cyan-500 hover:shadow-lg hover:shadow-violet-500/50 transition-all text-sm font-medium">
                            Login Now
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-[350px] flex items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/20">
                    <div className="text-center">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        Fill in your details and click "Generate Resume" to see your resume here
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Summary Picker (Beginner only — Doc 6) ──
                Shown after first "Generate Resume" click fetches summaryOptions.
                Clicking a card ONLY sets selectedSummary — no API call.
                User must click "Generate Resume" again to build the PDF.
            ── */}
            {userType === "beginner" && summaryOptions.length > 0 && (
              <div className="p-6 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-white/[0.02] backdrop-blur-sm">
                <h3 className="text-xl mb-2 flex items-center gap-2">
                  <Sparkle className="w-5 h-5 text-violet-400" />
                  Choose Your Summary
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select the summary that best represents you, then click{" "}
                  <span className="text-violet-300 font-medium">Generate Resume</span> to build your PDF.
                </p>
                <div className="space-y-3">
                  {summaryOptions.map((option, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedSummary(option)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        selectedSummary === option
                          ? "border-violet-500/60 bg-violet-500/10 text-white"
                          : "border-white/10 bg-white/5 text-muted-foreground hover:border-violet-500/30 hover:text-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${selectedSummary === option ? "border-violet-500 bg-violet-500" : "border-white/30"}`}>
                          {selectedSummary === option && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <p className="text-sm leading-relaxed">{option}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {selectedSummary && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-green-500/[0.07] border border-green-500/20">
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    <p className="text-xs text-green-300">
                      Summary selected! Now click{" "}
                      <span className="font-semibold">Generate Resume</span> to build your PDF.
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            {/* ── AI Suggestions / Suggested Projects ── */}
            <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm">
              <h3 className="text-xl mb-4 flex items-center gap-2">
                {userType === "experienced"
                  ? <><Sparkles className="w-5 h-5 text-cyan-400" />AI Suggestions</>
                  : <><Lightbulb className="w-5 h-5 text-cyan-400" />Suggested Projects</>}
              </h3>
              <div className="space-y-3">
                {userType === "experienced" ? (
                  <>
                    {(atsResult?.missing?.length ?? 0) > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">ATS Improvements</p>
                        {atsResult?.missing?.map((m: string, i: number) => (
                          <div key={`ats-${i}`} className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2">
                            <TriangleAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                            <span className="text-sm">{m}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {aiSuggestions.length > 0 && (
                      <div className="space-y-3 mt-4">
                        <p className="text-sm text-muted-foreground">AI Content Suggestions</p>
                        {aiSuggestions.map((s: string, i: number) => (
                          <div key={`ai-${i}`} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/30 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-xs">{i + 1}</span>
                              </div>
                              <p className="text-sm">{s}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {!atsResult?.missing?.length && aiSuggestions.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Your resume looks solid! No major optimization issues detected.
                      </p>
                    )}
                  </>
                ) : projectSuggestions.length > 0 ? (
                  projectSuggestions.map((project, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/30 transition-colors">
                      <p className="text-sm font-medium">{project.title}</p>
                      {project.bullets?.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {project.bullets.map((bullet, idx) => (
                            <li key={idx} className="text-xs text-muted-foreground">• {bullet}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Generate your resume to see project suggestions tailored to your skills!
                  </p>
                )}
              </div>
            </div>

            {/* ── Recommended Certifications (rich card from Doc 5, both user types) ── */}
            <CertificationsSection />

          </motion.div>
        </div>
      </div>
    </section>
  );
}