import { motion } from "motion/react";
import React, { useState, useRef, useCallback } from "react";

import {
  Upload,
  FileCheck,
  Target,
  TrendingUp,
  Sparkles,
  CircleCheck,
  TriangleAlert,
  User,
  GraduationCap,
  FileText,
  Lightbulb,
  Briefcase,
  AlertCircle,
  X,
  File,
  CheckCircle2,
  Sparkle,
} from "lucide-react";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

import axios from "axios";

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

// Beginner required-field errors
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

// Per-field format errors (key = dotted path)
type FieldFormatErrors = Record<string, string>;

// ─────────────────────────────────────────────
// Validation helpers
// ─────────────────────────────────────────────
const validateEmail = (val: string): string | null => {
  if (!val.trim()) return null; // handled by required check
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
// Component
// ─────────────────────────────────────────────
export function Dashboard() {
  const [userType, setUserType] = useState<"experienced" | "beginner">(
    "experienced",
  );
  const [higherEducation, setHigherEducation] = useState<"class12" | "diploma">(
    "class12",
  );

  const [generatedResume, setGeneratedResume] =
    useState<OptimizedResume | null>(null);
  const [changeLog, setChangeLog] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [useAI, setUseAI] = useState(true);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [atsResult, setAtsResult] = useState<any>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [projectSuggestions, setProjectSuggestions] = useState<
    SuggestedProject[]
  >([]);
  const [certificationSuggestions, setCertificationSuggestions] = useState<
    any[]
  >([]);

  // ── Drag & drop state ──
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Experienced: optimized resume PDF preview ──
  const [expPdfUrl, setExpPdfUrl] = useState<string | null>(null);
  const [optimising, setOptimising] = useState(false);

  // ── Job description (shared) ──
  const [jobDescription, setJobDescription] = useState("");

  const atsScoreData = atsResult
    ? [{ name: "ATS Score", value: atsResult.overall }]
    : [{ name: "ATS Score", value: 0 }];

  // ── Beginner required-field errors ──
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );
  const [showErrors, setShowErrors] = useState(false);

  // ── Beginner format errors (live) ──
  const [formatErrors, setFormatErrors] = useState<FieldFormatErrors>({});

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    full_name: "",
    role: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    education: {
      tenth: {},
      twelfthOrDiploma: {},
      degree: {},
    },
    skills: {
      technical: "",
      soft: "",
    },
    experience: [],
    projects: [],
    certifications: "",
  });

  // ─────────────────────────────────────────────
  // ATS helpers
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
  // Beginner – required validation
  // ─────────────────────────────────────────────
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    if (userType === "beginner") {
      if (!form.full_name.trim()) errors.full_name = true;
      if (!form.role.trim()) errors.role = true;
      if (!form.email.trim()) errors.email = true;
      if (!form.skills.technical.trim()) errors.technical = true;

      // Class 10 - ALL fields mandatory
      if (!form.education.tenth.institution?.trim())
        errors.tenth_institution = true;
      if (!form.education.tenth.board?.trim()) errors.tenth_board = true;
      if (!form.education.tenth.percentage?.trim())
        errors.tenth_percentage = true;
      if (!form.education.tenth.year?.trim()) errors.tenth_year = true;
    }
    setValidationErrors(errors);
    setShowErrors(true);
    return Object.keys(errors).length === 0;
  };

  // ─────────────────────────────────────────────
  // Live format validation – runs on every change
  // ─────────────────────────────────────────────
  const runFormatValidation = useCallback((next: FormState) => {
    const errs: FieldFormatErrors = {};

    const e = validateEmail(next.email);
    if (e) errs["email"] = e;

    const p = validatePhone(next.phone);
    if (p) errs["phone"] = p;

    const li = validateURL(next.linkedin, "LinkedIn");
    if (li) errs["linkedin"] = li;

    const gh = validateURL(next.github, "GitHub");
    if (gh) errs["github"] = gh;

    // 10th percentage
    const p10 = validatePercentage(next.education.tenth.percentage || "");
    if (p10) errs["tenth.percentage"] = p10;

    // 10th year
    const y10 = validateYear(next.education.tenth.year || "");
    if (y10) errs["tenth.year"] = y10;

    // 12th / diploma percentage
    const p12 = validatePercentage(
      next.education.twelfthOrDiploma.percentage || "",
    );
    if (p12) errs["twelfthOrDiploma.percentage"] = p12;

    // 12th / diploma year
    const y12 = validateYear(next.education.twelfthOrDiploma.year || "");
    if (y12) errs["twelfthOrDiploma.year"] = y12;

    // degree GPA
    const gpa = validateGPA(next.education.degree.gpa || "");
    if (gpa) errs["degree.gpa"] = gpa;

    // degree year
    const yd = validateYear(next.education.degree.year || "");
    if (yd) errs["degree.year"] = yd;

    setFormatErrors(errs);
  }, []);

  // ─────────────────────────────────────────────
  // Experience / Project CRUD
  // ─────────────────────────────────────────────
  const addExperience = () => {
    setForm((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        { role: "", company: "", location: "", duration: "", bullets: "" },
      ],
    }));
  };

  const removeExperience = (index: number) => {
    setForm((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  };

  const updateExperience = (
    index: number,
    field: keyof Experience,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      experience: prev.experience.map((exp, i) =>
        i === index ? { ...exp, [field]: value } : exp,
      ),
    }));
  };

  const addProject = () => {
    setForm((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        { title: "", technologies: "", description: "" },
      ],
    }));
  };

  const removeProject = (index: number) => {
    setForm((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index),
    }));
  };

  const updateProject = (
    index: number,
    field: keyof Project,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      projects: prev.projects.map((proj, i) =>
        i === index ? { ...proj, [field]: value } : proj,
      ),
    }));
  };

  // ─────────────────────────────────────────────
  // Payload builder
  // ─────────────────────────────────────────────
  const buildPayload = () => {
    const educationArray: EducationLevel[] = [];
    if (form.education.tenth?.institution) {
      educationArray.push({
        level: "10th",
        institution: form.education.tenth.institution,
        board: form.education.tenth.board,
        percentage: form.education.tenth.percentage,
        year: form.education.tenth.year,
      });
    }
    if (form.education.twelfthOrDiploma?.institution) {
      educationArray.push({
        level: higherEducation === "class12" ? "12th" : "Diploma",
        institution: form.education.twelfthOrDiploma.institution,
        board: form.education.twelfthOrDiploma.board,
        percentage: form.education.twelfthOrDiploma.percentage,
        year: form.education.twelfthOrDiploma.year,
      });
    }
    if (form.education.degree?.institution) {
      educationArray.push({
        level: "Undergraduate",
        institution: form.education.degree.institution,
        degree: form.education.degree.degree,
        gpa: form.education.degree.gpa,
        year: form.education.degree.year,
      });
    }

    const experienceArray = form.experience
      .filter((exp) => exp.role && exp.company && exp.duration)
      .map((exp) => ({
        role: exp.role,
        company: exp.company,
        location: exp.location || undefined,
        duration: exp.duration,
        bullets: exp.bullets
          ? exp.bullets.split("\n").filter((line) => line.trim())
          : [],
      }));

    const projectsArray = form.projects
      .filter((proj) => proj.title && proj.title.trim())
      .map((proj) => ({
        title: proj.title.trim(),
        technologies: proj.technologies
          ? proj.technologies
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t)
          : [],
        description: proj.description
          ? proj.description
              .split("\n")
              .map((line) => line.trim())
              .filter((line) => line.length > 0)
          : [],
      }));

    const certificationsArray = form.certifications
      ? form.certifications
          .split("\n")
          .map((cert) => cert.trim())
          .filter((cert) => cert)
      : [];

    return {
      full_name: form.full_name,
      role: form.role,
      email: form.email,
      phone: form.phone || undefined,
      location: form.location || undefined,
      linkedin: form.linkedin || undefined,
      github: form.github || undefined,
      skills: form.skills.technical
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s),
      softSkills: form.skills.soft
        ? form.skills.soft
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s)
        : undefined,
      experience: experienceArray.length > 0 ? experienceArray : undefined,
      projects: projectsArray.length > 0 ? projectsArray : undefined,
      education: educationArray,
      certifications:
        certificationsArray.length > 0 ? certificationsArray : undefined,
      useAI,
      jobDescription: jobDescription || undefined,
    };
  };

  // ─────────────────────────────────────────────
  // PDF helpers
  // ─────────────────────────────────────────────
  const downloadPDF = async (url: string | null) => {
    if (!url) return;
    try {
      const res = await axios.post(
        "http://localhost:4000/api/public/export-pdf",
        { optimizedResume: generatedResume },
        { responseType: "blob" },
      );
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", "Resume.pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("PDF download failed:", error);
      alert("Failed to download PDF. Please try again.");
    }
  };

  const generateAndPreviewPDF = async (
    resumeData: OptimizedResume,
    setter: (u: string | null) => void,
  ) => {
    if (!resumeData?.header?.name) return;
    try {
      const response = await axios.post(
        "http://localhost:4000/api/public/export-pdf",
        { optimizedResume: resumeData },
        { responseType: "blob" },
      );
      const blob = new Blob([response.data], { type: "application/pdf" });
      setter(URL.createObjectURL(blob));
    } catch (error) {
      console.error("PDF preview failed:", error);
    }
  };

  // ─────────────────────────────────────────────
  // Experienced – Analyse (existing flow)
  // ─────────────────────────────────────────────
  const handleGenerateResume = async () => {
    try {
      setLoading(true);

      if (userType === "experienced") {
        if (!resumeFile) {
          alert("Please upload your resume first");
          return;
        }
        const formData = new FormData();
        formData.append("resume", resumeFile);
        const res = await axios.post(
          "http://localhost:4000/api/public/analyze",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        );
        const { optimizedResume, atsScore, analysis } = res.data;
        setGeneratedResume(optimizedResume || null);
        setAtsResult(atsScore || null);
        setCertificationSuggestions(res.data.certificationSuggestions || []);
        setAiSuggestions(
          analysis?.weaknesses && Array.isArray(analysis.weaknesses)
            ? analysis.weaknesses
            : [],
        );
        // if (optimizedResume?.header?.name) {
        //   await generateAndPreviewPDF(optimizedResume, setPdfUrl);
        // }
        return;
      }

      // ── Beginner flow ──
      if (userType === "beginner") {
        // Block if live format errors exist
        if (Object.keys(formatErrors).length > 0) {
          alert(
            "Please fix the highlighted errors before generating your resume.",
          );
          return;
        }
        if (!validateForm()) return;

        const payload = buildPayload();
        console.log("[BEGINNER] useAI:", useAI);
        console.log("[BEGINNER] jobDescription:", jobDescription);
        console.log("[BEGINNER] payload:", payload);
        const res = await axios.post(
          "http://localhost:4000/api/public/create-resume",
          payload,
        );
        const { optimizedResume, atsScore, analysis } = res.data;

        setGeneratedResume(optimizedResume || null);
        setProjectSuggestions(res.data.projectSuggestions || []);
        setCertificationSuggestions(res.data.certificationsRecommended || []);

        if (optimizedResume?.header?.name) {
          await generateAndPreviewPDF(optimizedResume, setPdfUrl);
        }

        setValidationErrors({});
        setShowErrors(false);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        alert(
          err.response?.data?.message ||
            "Backend error while processing resume.",
        );
      } else {
        alert("Unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // Experienced – Optimise resume (new)
  // ─────────────────────────────────────────────
  const handleOptimiseResume = async () => {
    if (!resumeFile) {
      alert("Please upload your resume first");
      return;
    }
    try {
      setOptimising(true);
      const formData = new FormData();
      formData.append("resume", resumeFile);
      if (jobDescription.trim())
        formData.append("jobDescription", jobDescription.trim());

      const res = await axios.post(
        "http://localhost:4000/api/public/analyze",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      const { optimizedResume } = res.data;
      setGeneratedResume(optimizedResume || null);

      if (optimizedResume?.header?.name) {
        await generateAndPreviewPDF(optimizedResume, setExpPdfUrl);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.message || "Failed to optimise resume.");
      } else {
        alert("Unexpected error. Please try again.");
      }
    } finally {
      setOptimising(false);
    }
  };

  // ─────────────────────────────────────────────
  // Form change handler + live validation
  // ─────────────────────────────────────────────
  const handleChange = (path: (string | number)[], value: string) => {
    setForm((prev) => {
      const updated = structuredClone(prev);
      let ref: any = updated;
      path.forEach((key, index) => {
        if (index === path.length - 1) {
          ref[key] = value;
        } else {
          ref[key] = ref[key] ?? {};
          ref = ref[key];
        }
      });
      // Run live format validation on the new state
      runFormatValidation(updated);
      return updated;
    });

    // Clear required-field error for this field
    if (showErrors) {
      const fieldName = path[path.length - 1] as keyof ValidationErrors;
      if (validationErrors[fieldName]) {
        setValidationErrors((prev) => ({ ...prev, [fieldName]: false }));
      }
    }
  };

  // ─────────────────────────────────────────────
  // Drag & drop handlers
  // ─────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && /\.(pdf|doc|docx)$/i.test(file.name)) {
      setResumeFile(file);
    } else {
      alert("Please upload a PDF, DOC, or DOCX file.");
    }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setResumeFile(e.target.files[0]);
  };

  // ─────────────────────────────────────────────
  // ClassName helpers
  // ─────────────────────────────────────────────
  const getInputClassName = (
    fieldName: keyof ValidationErrors,
    baseClassName: string,
  ) => {
    const hasError = showErrors && validationErrors[fieldName];
    return `${baseClassName} ${hasError ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-violet-500/50"}`;
  };

  // Helper: returns border colour based on format-error key
  const fmtBorder = (key: string) =>
    formatErrors[key]
      ? "border-red-500 focus:border-red-500"
      : "border-white/10 focus:border-violet-500/50";

  // Helper: inline error pill
  const FmtError = ({ id }: { id: string }) =>
    formatErrors[id] ? (
      <p className="text-xs text-red-400 mt-1 ml-1 flex items-center gap-1">
        <TriangleAlert className="w-3 h-3" /> {formatErrors[id]}
      </p>
    ) : null;

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
            Analyze your resume, get insights, and discover opportunities in one
            powerful interface
          </p>

          {/* User Type Selector */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className="text-sm text-muted-foreground">
              Candidate Type:
            </span>
            <div className="inline-flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
              {/*AFTER - Experienced button*/}
              <button
                onClick={() => {
                  setUserType("experienced");
                  setCertificationSuggestions([]);
                  setProjectSuggestions([]);
                  setAiSuggestions([]);
                  setAtsResult(null);
                  setPdfUrl(null);
                  setExpPdfUrl(null);
                  setGeneratedResume(null);
                }}
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
                onClick={() => {
                  setUserType("beginner");
                  setCertificationSuggestions([]);
                  setProjectSuggestions([]);
                  setAiSuggestions([]);
                  setAtsResult(null);
                  setPdfUrl(null);
                  setExpPdfUrl(null);
                  setGeneratedResume(null);
                }}
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

        {/* ═══════════════════════════════════════════
            Main grid
        ═══════════════════════════════════════════ */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* ── Left Panel ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* ────────────────────────────────────
                EXPERIENCED – Upload card
            ──────────────────────────────────── */}
            {userType === "experienced" ? (
              <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm">
                <h3 className="text-xl mb-1 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-violet-400" />
                  Upload Resume
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Supports PDF, DOC, and DOCX formats
                </p>

                {/* Hidden native input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                {/* ── No file selected – drop zone ── */}
                {!resumeFile ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                      relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300 p-8 flex flex-col items-center justify-center text-center
                      ${
                        isDragging
                          ? "border-violet-400 bg-violet-500/10 scale-[1.02] shadow-lg shadow-violet-500/20"
                          : "border-white/15 hover:border-violet-500/50 hover:bg-white/[0.03] bg-black/20"
                      }
                    `}
                  >
                    {/* Glow ring behind icon when dragging */}
                    <div
                      className={`relative mb-4 transition-all duration-300 ${isDragging ? "scale-110" : ""}`}
                    >
                      <div
                        className={`absolute inset-0 rounded-full blur-lg transition-opacity duration-300 ${isDragging ? "opacity-100 bg-violet-500/30" : "opacity-0"}`}
                      />
                      <div
                        className={`relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${isDragging ? "bg-violet-500/20 border border-violet-500/40" : "bg-white/5 border border-white/10"}`}
                      >
                        <Upload
                          className={`w-7 h-7 transition-colors duration-300 ${isDragging ? "text-violet-300" : "text-muted-foreground"}`}
                        />
                      </div>
                    </div>

                    <p
                      className={`text-sm font-medium transition-colors duration-300 ${isDragging ? "text-violet-300" : "text-white/80"}`}
                    >
                      {isDragging
                        ? "Drop your resume here"
                        : "Drag & drop your resume"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      or click to browse
                    </p>

                    {/* Accepted formats */}
                    <div className="flex items-center gap-2 mt-4">
                      {["PDF", "DOC", "DOCX"].map((fmt) => (
                        <span
                          key={fmt}
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-white/5 border border-white/10 text-muted-foreground"
                        >
                          {fmt}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* ── File selected – preview card ── */
                  <div className="rounded-xl border border-green-500/20 bg-green-500/[0.06] p-4">
                    <div className="flex items-center gap-3">
                      {/* File-type icon */}
                      <div className="w-11 h-11 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-violet-400" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {resumeFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(resumeFile.size / 1024).toFixed(1)} KB •{" "}
                          {resumeFile.name.split(".").pop()?.toUpperCase()}
                        </p>
                      </div>

                      {/* Status badge */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/25">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-xs text-green-400 font-medium">
                          Ready
                        </span>
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => setResumeFile(null)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Re-upload link */}
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
              /* ──────────────────────────────────
                  BEGINNER – Your Details form
              ────────────────────────────────── */
              <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm">
                <h3 className="text-xl mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-violet-400" />
                  Your Details
                </h3>

                {/* Error Summary */}
                {showErrors && Object.keys(validationErrors).length > 0 && (
                  <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-red-400 font-medium mb-1">
                          Please fill in all required fields
                        </p>
                        <p className="text-xs text-red-400/80">
                          Required fields are marked with an asterisk (*)
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Format-error banner (live) */}
                {Object.keys(formatErrors).length > 0 && (
                  <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
                    <TriangleAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-400">
                      Please fix the highlighted fields before continuing
                    </p>
                  </div>
                )}

                <div className="max-h-[700px] overflow-y-auto scrollbar-thin scrollbar-thumb-violet-500/50 scrollbar-track-white/5 pr-2">
                  <div className="space-y-6">
                    {/* ── Personal Information ── */}
                    <div>
                      <label className="block text-sm text-muted-foreground mb-3">
                        Personal Information
                      </label>
                      <div className="space-y-3">
                        {/* Full Name */}
                        <div>
                          <input
                            type="text"
                            placeholder="Full Name *"
                            className={getInputClassName(
                              "full_name",
                              "w-full px-4 py-3 rounded-xl bg-white/5 outline-none text-sm",
                            )}
                            value={form.full_name}
                            onChange={(e) =>
                              handleChange(["full_name"], e.target.value)
                            }
                          />
                          {showErrors && validationErrors.full_name && (
                            <p className="text-xs text-red-400 mt-1 ml-1">
                              Full name is required
                            </p>
                          )}
                        </div>

                        {/* Role */}
                        <div>
                          <input
                            type="text"
                            placeholder="Role / Desired Job Title * (e.g., Frontend Developer)"
                            className={getInputClassName(
                              "role",
                              "w-full px-4 py-3 rounded-xl bg-white/5 outline-none text-sm",
                            )}
                            value={form.role}
                            onChange={(e) =>
                              handleChange(["role"], e.target.value)
                            }
                          />
                          {showErrors && validationErrors.role && (
                            <p className="text-xs text-red-400 mt-1 ml-1">
                              Role is required
                            </p>
                          )}
                        </div>

                        {/* Email */}
                        <div>
                          <input
                            type="text"
                            placeholder="Email Address *"
                            className={`w-full px-4 py-3 rounded-xl bg-white/5 outline-none text-sm border ${
                              (showErrors && validationErrors.email) ||
                              formatErrors["email"]
                                ? "border-red-500 focus:border-red-500"
                                : "border-white/10 focus:border-violet-500/50"
                            }`}
                            value={form.email}
                            onChange={(e) =>
                              handleChange(["email"], e.target.value)
                            }
                          />
                          {showErrors &&
                            validationErrors.email &&
                            !formatErrors["email"] && (
                              <p className="text-xs text-red-400 mt-1 ml-1">
                                Email is required
                              </p>
                            )}
                          <FmtError id="email" />
                        </div>

                        {/* Phone + Location row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <input
                              type="text"
                              placeholder="Phone Number (Optional)"
                              className={`w-full px-4 py-3 rounded-xl bg-white/5 outline-none text-sm border ${fmtBorder("phone")}`}
                              value={form.phone}
                              onChange={(e) =>
                                handleChange(["phone"], e.target.value)
                              }
                            />
                            <FmtError id="phone" />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Location (Optional)"
                              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                              value={form.location}
                              onChange={(e) =>
                                handleChange(["location"], e.target.value)
                              }
                            />
                          </div>
                        </div>

                        {/* LinkedIn + GitHub row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <input
                              type="text"
                              placeholder="LinkedIn Profile URL (Optional)"
                              className={`w-full px-4 py-3 rounded-xl bg-white/5 outline-none text-sm border ${fmtBorder("linkedin")}`}
                              value={form.linkedin}
                              onChange={(e) =>
                                handleChange(["linkedin"], e.target.value)
                              }
                            />
                            <FmtError id="linkedin" />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="GitHub Profile URL (Optional)"
                              className={`w-full px-4 py-3 rounded-xl bg-white/5 outline-none text-sm border ${fmtBorder("github")}`}
                              value={form.github}
                              onChange={(e) =>
                                handleChange(["github"], e.target.value)
                              }
                            />
                            <FmtError id="github" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Education ── */}
                    <div>
                      <label className="block text-sm text-muted-foreground mb-2">
                        Education
                      </label>

                      {/* Class 10 */}
                      <div className="space-y-3 mb-4">
                        <p className="text-xs text-muted-foreground">
                          Class 10 (SSC)
                        </p>
                        <input
                          type="text"
                          placeholder="School Name"
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                          onChange={(e) =>
                            handleChange(
                              ["education", "tenth", "institution"],
                              e.target.value,
                            )
                          }
                        />
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <input
                              type="text"
                              placeholder="Board"
                              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                              onChange={(e) =>
                                handleChange(
                                  ["education", "tenth", "board"],
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Year"
                              className={`w-full px-4 py-3 rounded-xl bg-white/5 outline-none text-sm border ${fmtBorder("tenth.year")}`}
                              onChange={(e) =>
                                handleChange(
                                  ["education", "tenth", "year"],
                                  e.target.value,
                                )
                              }
                            />
                            <FmtError id="tenth.year" />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Marks %"
                              className={`w-full px-4 py-3 rounded-xl bg-white/5 outline-none text-sm border ${fmtBorder("tenth.percentage")}`}
                              onChange={(e) =>
                                handleChange(
                                  ["education", "tenth", "percentage"],
                                  e.target.value,
                                )
                              }
                            />
                            <FmtError id="tenth.percentage" />
                          </div>
                        </div>
                      </div>

                      {/* Class 12 / Diploma toggle */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => setHigherEducation("class12")}
                            className={`px-4 py-2 rounded-xl text-xs transition-all ${
                              higherEducation === "class12"
                                ? "bg-violet-500/20 border border-violet-500/50 text-violet-400"
                                : "bg-white/5 border border-white/10 text-muted-foreground"
                            }`}
                          >
                            Class 12
                          </button>
                          <button
                            type="button"
                            onClick={() => setHigherEducation("diploma")}
                            className={`px-4 py-2 rounded-xl text-xs transition-all ${
                              higherEducation === "diploma"
                                ? "bg-violet-500/20 border border-violet-500/50 text-violet-400"
                                : "bg-white/5 border border-white/10 text-muted-foreground"
                            }`}
                          >
                            Diploma
                          </button>
                        </div>

                        <input
                          type="text"
                          placeholder={
                            higherEducation === "class12"
                              ? "School Name"
                              : "College / Institute Name"
                          }
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                          onChange={(e) =>
                            handleChange(
                              ["education", "twelfthOrDiploma", "institution"],
                              e.target.value,
                            )
                          }
                        />
                        <input
                          type="text"
                          placeholder={
                            higherEducation === "class12"
                              ? "Board (e.g., CBSE, State Board)"
                              : "Board / University"
                          }
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                          onChange={(e) =>
                            handleChange(
                              ["education", "twelfthOrDiploma", "board"],
                              e.target.value,
                            )
                          }
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <input
                              type="text"
                              placeholder="Year"
                              className={`w-full px-4 py-3 rounded-xl bg-white/5 outline-none text-sm border ${fmtBorder("twelfthOrDiploma.year")}`}
                              onChange={(e) =>
                                handleChange(
                                  ["education", "twelfthOrDiploma", "year"],
                                  e.target.value,
                                )
                              }
                            />
                            <FmtError id="twelfthOrDiploma.year" />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Percentage"
                              className={`w-full px-4 py-3 rounded-xl bg-white/5 outline-none text-sm border ${fmtBorder("twelfthOrDiploma.percentage")}`}
                              onChange={(e) =>
                                handleChange(
                                  [
                                    "education",
                                    "twelfthOrDiploma",
                                    "percentage",
                                  ],
                                  e.target.value,
                                )
                              }
                            />
                            <FmtError id="twelfthOrDiploma.percentage" />
                          </div>
                        </div>
                      </div>

                      {/* Degree */}
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground">
                          Engineering / Degree (Optional)
                        </p>
                        <input
                          type="text"
                          placeholder="College / University Name"
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                          onChange={(e) =>
                            handleChange(
                              ["education", "degree", "institution"],
                              e.target.value,
                            )
                          }
                        />
                        <input
                          type="text"
                          placeholder="Degree Name (e.g., B.Tech, BCA, B.Sc)"
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                          onChange={(e) =>
                            handleChange(
                              ["education", "degree", "degree"],
                              e.target.value,
                            )
                          }
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <input
                              type="text"
                              placeholder="Year"
                              className={`w-full px-4 py-3 rounded-xl bg-white/5 outline-none text-sm border ${fmtBorder("degree.year")}`}
                              onChange={(e) =>
                                handleChange(
                                  ["education", "degree", "year"],
                                  e.target.value,
                                )
                              }
                            />
                            <FmtError id="degree.year" />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="GPA / CGPA"
                              className={`w-full px-4 py-3 rounded-xl bg-white/5 outline-none text-sm border ${fmtBorder("degree.gpa")}`}
                              onChange={(e) =>
                                handleChange(
                                  ["education", "degree", "gpa"],
                                  e.target.value,
                                )
                              }
                            />
                            <FmtError id="degree.gpa" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Skills ── */}
                    <div>
                      <label className="block text-sm text-muted-foreground mb-3">
                        Skills
                      </label>
                      <div className="space-y-3">
                        <div>
                          <input
                            type="text"
                            placeholder="Technical Skills * (comma separated, e.g., React, Node.js, Python)"
                            className={getInputClassName(
                              "technical",
                              "w-full px-4 py-3 rounded-xl bg-white/5 outline-none text-sm",
                            )}
                            value={form.skills.technical}
                            onChange={(e) =>
                              handleChange(
                                ["skills", "technical"],
                                e.target.value,
                              )
                            }
                          />
                          {showErrors && validationErrors.technical && (
                            <p className="text-xs text-red-400 mt-1 ml-1">
                              At least one technical skill is required
                            </p>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="Soft Skills (Optional, comma separated, e.g., Leadership, Communication)"
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                          value={form.skills.soft}
                          onChange={(e) =>
                            handleChange(["skills", "soft"], e.target.value)
                          }
                        />
                      </div>
                    </div>

                    {/* ── Experience ── */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm text-muted-foreground">
                          Experience (Optional)
                        </label>
                        <button
                          type="button"
                          onClick={addExperience}
                          className="px-3 py-1 rounded-lg bg-violet-500/20 border border-violet-500/50 text-violet-400 text-xs hover:bg-violet-500/30 transition-all"
                        >
                          + Add Experience
                        </button>
                      </div>
                      {form.experience.map((exp, index) => (
                        <div
                          key={index}
                          className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-violet-400">
                              Experience {index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeExperience(index)}
                              className="text-xs text-red-400 hover:text-red-300"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="space-y-3">
                            <input
                              type="text"
                              placeholder="Job Title"
                              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                              value={exp.role}
                              onChange={(e) =>
                                updateExperience(index, "role", e.target.value)
                              }
                            />
                            <input
                              type="text"
                              placeholder="Company Name"
                              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                              value={exp.company}
                              onChange={(e) =>
                                updateExperience(
                                  index,
                                  "company",
                                  e.target.value,
                                )
                              }
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="text"
                                placeholder="Location (Optional)"
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                                value={exp.location}
                                onChange={(e) =>
                                  updateExperience(
                                    index,
                                    "location",
                                    e.target.value,
                                  )
                                }
                              />
                              <input
                                type="text"
                                placeholder="Dates (e.g., Jan 2023 - Present)"
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                                value={exp.duration}
                                onChange={(e) =>
                                  updateExperience(
                                    index,
                                    "duration",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <textarea
                              placeholder="Description (one bullet point per line)"
                              className="w-full h-24 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none resize-none text-sm"
                              value={exp.bullets}
                              onChange={(e) =>
                                updateExperience(
                                  index,
                                  "bullets",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ── Projects ── */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm text-muted-foreground">
                          Projects (Optional)
                        </label>
                        <button
                          type="button"
                          onClick={addProject}
                          className="px-3 py-1 rounded-lg bg-violet-500/20 border border-violet-500/50 text-violet-400 text-xs hover:bg-violet-500/30 transition-all"
                        >
                          + Add Project
                        </button>
                      </div>
                      {form.projects.map((proj, index) => (
                        <div
                          key={index}
                          className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-cyan-400">
                              Project {index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeProject(index)}
                              className="text-xs text-red-400 hover:text-red-300"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="space-y-3">
                            <input
                              type="text"
                              placeholder="Project Title"
                              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                              value={proj.title}
                              onChange={(e) =>
                                updateProject(index, "title", e.target.value)
                              }
                            />
                            <input
                              type="text"
                              placeholder="Technologies Used (comma separated)"
                              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                              value={proj.technologies}
                              onChange={(e) =>
                                updateProject(
                                  index,
                                  "technologies",
                                  e.target.value,
                                )
                              }
                            />
                            <textarea
                              placeholder="Description (one bullet point per line)"
                              className="w-full h-24 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none resize-none text-sm"
                              value={proj.description}
                              onChange={(e) =>
                                updateProject(
                                  index,
                                  "description",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ── Certifications ── */}
                    <div>
                      <label className="block text-sm text-muted-foreground mb-3">
                        Certifications (Optional)
                      </label>
                      <textarea
                        placeholder="List your certifications (one per line)"
                        className="w-full h-24 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none resize-none text-sm"
                        value={form.certifications}
                        onChange={(e) =>
                          handleChange(["certifications"], e.target.value)
                        }
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

              {/* Primary action button */}
              <button
                className="w-full mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 hover:shadow-lg hover:shadow-violet-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleGenerateResume}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {userType === "experienced"
                      ? "Analyzing..."
                      : "Generating..."}
                  </span>
                ) : userType === "experienced" ? (
                  "Analyze Match"
                ) : (
                  "Generate Resume"
                )}
              </button>

              {/* ── Optimise Resume button (Experienced only) ── */}
              {userType === "experienced" && (
                <button
                  className="w-full mt-3 px-6 py-3 rounded-xl border border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20 hover:border-violet-500/60 hover:shadow-md hover:shadow-violet-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-violet-300"
                  onClick={handleOptimiseResume}
                  disabled={optimising || !resumeFile}
                >
                  {optimising ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Optimising…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Optimise Resume
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>

          {/* ── Right Panel ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* ────────────────────────────────────
                EXPERIENCED – ATS score card
            ──────────────────────────────────── */}
            {userType === "experienced" && (
              <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl mb-2">ATS Compatibility Score</h3>
                    <p className="text-sm text-muted-foreground">
                      Your resume's compatibility with Applicant Tracking
                      Systems
                    </p>
                  </div>
                  {atsResult && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30">
                      <CircleCheck className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-400">Excellent</span>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Radial chart */}
                  <div className="flex items-center justify-center">
                    <div className="relative w-48 h-48">
                      <RadialBarChart
                        width={192}
                        height={192}
                        cx={96}
                        cy={96}
                        innerRadius={76}
                        outerRadius={96}
                        data={atsScoreData}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <defs>
                          <linearGradient
                            id="gradientATS"
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="1"
                          >
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#06b6d4" />
                          </linearGradient>
                        </defs>
                        <PolarAngleAxis
                          type="number"
                          domain={[0, 100]}
                          angleAxisId={0}
                          tick={false}
                        />
                        <RadialBar
                          background
                          dataKey="value"
                          cornerRadius={10}
                          fill="url(#gradientATS)"
                        />
                      </RadialBarChart>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                            {atsResult?.overall ?? "--"}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ATS Score
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">
                          Keyword Match
                        </span>
                        <span className="text-green-400">
                          {toPercent(
                            atsResult?.breakdown?.keywords,
                            ATS_MAX.keywords,
                          )}
                          %
                        </span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
                          style={{
                            width: `${toPercent(atsResult?.breakdown?.keywords, ATS_MAX.keywords)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">
                          Format Score
                        </span>
                        <span className="text-cyan-400">
                          {toPercent(
                            atsResult?.breakdown?.formatting,
                            ATS_MAX.formatting,
                          )}
                          %
                        </span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                          style={{
                            width: `${toPercent(atsResult?.breakdown?.formatting, ATS_MAX.formatting)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">
                          Experience Match
                        </span>
                        <span className="text-violet-400">
                          {toPercent(
                            atsResult?.breakdown?.readability,
                            ATS_MAX.readability,
                          )}
                          %
                        </span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all"
                          style={{
                            width: `${toPercent(atsResult?.breakdown?.readability, ATS_MAX.readability)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  Contact Info:{" "}
                  {toPercent(atsResult?.breakdown?.contact, ATS_MAX.contact)}% •
                  Sections:{" "}
                  {toPercent(atsResult?.breakdown?.sections, ATS_MAX.sections)}%
                </p>
              </div>
            )}

            {/* ────────────────────────────────────
                EXPERIENCED – Optimised Resume Preview (new)
            ──────────────────────────────────── */}
            {userType === "experienced" && (
              <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl mb-2 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-violet-400" />
                      Optimised Resume
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      AI-optimised version of your uploaded resume
                    </p>
                  </div>
                  {expPdfUrl && (
                    <button
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 hover:shadow-lg hover:shadow-violet-500/50 transition-all text-sm"
                      onClick={() => downloadPDF(expPdfUrl)}
                    >
                      Download PDF
                    </button>
                  )}
                </div>

                {optimising ? (
                  <div className="h-[350px] flex items-center justify-center rounded-xl border border-white/10 bg-black/20">
                    <div className="text-center">
                      <svg
                        className="animate-spin h-12 w-12 mx-auto mb-4 text-violet-400"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <p className="text-sm text-muted-foreground">
                        Optimising your resume…
                      </p>
                    </div>
                  </div>
                ) : expPdfUrl ? (
                  <div className="relative h-[350px] overflow-hidden rounded-xl border border-white/10 bg-black">
                    <iframe
                      src={`${expPdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                      className="w-full h-[600px] border-0 pointer-events-none"
                      scrolling="no"
                      style={{ overflow: "hidden" }}
                    />
                  </div>
                ) : (
                  <div className="h-[350px] flex items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/20">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Click{" "}
                        <span className="text-violet-400 font-medium">
                          Optimise Resume
                        </span>{" "}
                        to generate an AI-enhanced version
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ────────────────────────────────────
                BEGINNER – View Resume preview
            ──────────────────────────────────── */}
            {userType === "beginner" && (
              <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl mb-2 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-violet-400" />
                      View Your Resume
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      AI-generated resume based on your details
                    </p>
                  </div>
                  {pdfUrl && (
                    <button
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 hover:shadow-lg hover:shadow-violet-500/50 transition-all text-sm"
                      onClick={() => downloadPDF(pdfUrl)}
                    >
                      Download PDF
                    </button>
                  )}
                </div>

                {loading ? (
                  <div className="h-[350px] flex items-center justify-center rounded-xl border border-white/10 bg-black/20">
                    <div className="text-center">
                      <svg
                        className="animate-spin h-12 w-12 mx-auto mb-4 text-violet-400"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <p className="text-sm text-muted-foreground">
                        Generating your resume...
                      </p>
                    </div>
                  </div>
                ) : pdfUrl ? (
                  <div className="relative h-[350px] overflow-hidden rounded-xl border border-white/10 bg-black">
                    <iframe
                      src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                      className="w-full h-[600px] border-0 pointer-events-none"
                      scrolling="no"
                      style={{ overflow: "hidden" }}
                    />
                  </div>
                ) : (
                  <div className="h-[350px] flex items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/20">
                    <div className="text-center">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        Fill in your details and click "Generate Resume" to see
                        your resume here
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── AI Suggestions / Suggested Projects ── */}
            <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm">
              <h3 className="text-xl mb-4 flex items-center gap-2">
                {userType === "experienced" ? (
                  <>
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    AI Suggestions
                  </>
                ) : (
                  <>
                    <Lightbulb className="w-5 h-5 text-cyan-400" />
                    Suggested Projects
                  </>
                )}
              </h3>
              <div className="space-y-3">
                {userType === "experienced" ? (
                  <>
                    {atsResult?.missing?.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          ATS Improvements
                        </p>
                        {atsResult.missing.map((m: string, i: number) => (
                          <div
                            key={`ats-${i}`}
                            className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2"
                          >
                            <TriangleAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                            <span className="text-sm">{m}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {aiSuggestions.length > 0 && (
                      <div className="space-y-3 mt-4">
                        <p className="text-sm text-muted-foreground">
                          AI Content Suggestions
                        </p>
                        {aiSuggestions.map((s: string, i: number) => (
                          <div
                            key={`ai-${i}`}
                            className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/30 transition-colors"
                          >
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
                    {!atsResult?.missing?.length &&
                      aiSuggestions.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          Your resume looks solid! No major optimization issues
                          detected.
                        </p>
                      )}
                  </>
                ) : projectSuggestions.length > 0 ? (
                  projectSuggestions.map((project, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/30 transition-colors"
                    >
                      <p className="text-sm font-medium">{project.title}</p>
                      {project.bullets?.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {project.bullets.map((bullet, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-muted-foreground"
                            >
                              • {bullet}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Generate your resume to see project suggestions tailored to
                    your skills!
                  </p>
                )}
              </div>
            </div>
            {/* ═════ CERTIFICATIONS SECTION ═════ */}
            {userType === "experienced" && (
              <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <>
                    <Sparkle className="w-5 h-5 text-amber-400" />
                    Recommended Certifications
                  </>
                </h3>
                <div className="space-y-3">
                  {certificationSuggestions.length > 0 ? (
                    certificationSuggestions.map((cert: any, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{cert.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {cert.provider}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {cert.why}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Analyze your resume to see recommended certifications!
                    </p>
                  )}
                </div>
              </div>
            )}
            {/* After the existing Suggested Projects card, add: */}
            {userType === "beginner" && (
              <div className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Sparkle className="w-5 h-5 text-amber-400" />
                  Recommended Certifications
                </h3>
                <div className="space-y-3">
                  {certificationSuggestions.length > 0 ? (
                    certificationSuggestions.map((cert: any, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{cert.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {cert.provider}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {cert.why}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Generate your resume to see recommended certifications!
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
