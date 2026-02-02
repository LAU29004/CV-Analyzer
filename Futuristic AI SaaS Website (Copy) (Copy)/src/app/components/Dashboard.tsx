import { motion } from "motion/react";
import React, { useState } from "react";

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
} from "lucide-react";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

import axios from "axios";

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

type ValidationErrors = {
  full_name?: boolean;
  role?: boolean;
  email?: boolean;
  technical?: boolean;
};

const atsScoreData = [
  {
    name: "ATS Score",
    value: 85,
    fill: "url(#gradientATS)",
  },
];

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

  // Add state for project suggestions
  const [projectSuggestions, setProjectSuggestions] = useState<SuggestedProject[]>([]);

  // Add validation errors state
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [showErrors, setShowErrors] = useState(false);

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

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Required fields for beginner mode
    if (userType === "beginner") {
      if (!form.full_name.trim()) errors.full_name = true;
      if (!form.role.trim()) errors.role = true;
      if (!form.email.trim()) errors.email = true;
      if (!form.skills.technical.trim()) errors.technical = true;
    }

    setValidationErrors(errors);
    setShowErrors(true);

    return Object.keys(errors).length === 0;
  };

  const addExperience = () => {
    setForm((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          role: "",
          company: "",
          location: "",
          duration: "",
          bullets: "",
        },
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
        {
          title: "",
          technologies: "",
          description: "",
        },
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
    };
  };

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const downloadPDF = async () => {
    try {
      const res = await axios.post(
        "http://localhost:4000/api/public/export-pdf",
        { optimizedResume: generatedResume },
        { responseType: "blob" },
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Resume.pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("PDF download failed:", error);
      alert("Failed to download PDF. Please try again.");
    }
  };

  const handleGenerateResume = async () => {
    // Validate form if in beginner mode
    if (userType === "beginner" && !validateForm()) {
      // Scroll to first error
      const firstErrorElement = document.querySelector('[data-error="true"]');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    try {
      setLoading(true);

      const payload = buildPayload();
      console.log("Payload being sent:", JSON.stringify(payload, null, 2));

      const res = await axios.post(
        "http://localhost:4000/api/public/create-resume",
        payload,
      );

      console.log("Backend Response:", res.data);

      const resume: OptimizedResume = res.data.optimizedResume;

      // Extract project suggestions
      const suggestions =
        res.data.projectSuggestions ||
        res.data.changeLog?.projectSuggestions ||
        res.data.changeLog?.projects;

      if (Array.isArray(suggestions) && suggestions.length > 0) {
        console.log("Project suggestions received:", suggestions);
        setProjectSuggestions(suggestions);

        // Switch UI to Beginner mode if no experience was provided
        if (!payload.experience || payload.experience.length === 0) {
          setUserType("beginner");
        }
      } else {
        setProjectSuggestions([]);
      }

      setGeneratedResume(resume);

      // Generate & preview PDF only when resume is valid
      if (resume?.header?.name) {
        await generateAndPreviewPDF(resume);
      } else {
        console.warn("PDF generation skipped: invalid resume header");
      }

      // Clear errors on successful generation
      setShowErrors(false);
      setValidationErrors({});
    } catch (err) {
      console.error("Resume generation failed", err);

      if (axios.isAxiosError(err)) {
        console.error("Backend error:", err.response?.data);
        alert(
          err.response?.data?.message ||
            "Failed to generate resume. Please check your input and try again."
        );
      } else {
        alert("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const generateAndPreviewPDF = async (resumeData: OptimizedResume) => {
    if (!resumeData?.header?.name) {
      console.error("Invalid resume structure", resumeData);
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:4000/api/public/export-pdf",
        { optimizedResume: resumeData },
        { responseType: "blob" },
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error("PDF preview failed:", error);
    }
  };

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

      return updated;
    });

    // Clear error for this field when user types
    if (showErrors) {
      const fieldName = path[path.length - 1] as keyof ValidationErrors;
      if (validationErrors[fieldName]) {
        setValidationErrors((prev) => ({
          ...prev,
          [fieldName]: false,
        }));
      }
    }
  };

  const getInputClassName = (fieldName: keyof ValidationErrors, baseClassName: string) => {
    const hasError = showErrors && validationErrors[fieldName];
    return `${baseClassName} ${hasError ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-violet-500/50"}`;
  };

  return (
    <section
      id="dashboard"
      className="relative py-24 bg-gradient-to-b from-background via-violet-500/5 to-background"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <button
                onClick={() => setUserType("experienced")}
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
                onClick={() => setUserType("beginner")}
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

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Panel - Upload & Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Resume Upload (Experienced) or Details Form (Beginner) */}
            {userType === "experienced" ? (
              <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm">
                <h3 className="text-xl mb-4 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-violet-400" />
                  Upload Resume
                </h3>
                <div className="border-2 border-dashed border-violet-500/30 rounded-xl p-8 text-center hover:border-violet-500/50 transition-colors cursor-pointer group">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 p-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-full h-full text-white" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag & drop your resume here
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOC, DOCX up to 10MB
                  </p>
                </div>
              </div>
            ) : (
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

                <div className="max-h-[700px] overflow-y-auto scrollbar-thin scrollbar-thumb-violet-500/50 scrollbar-track-white/5 pr-2">
                  <div className="space-y-6">
                    {/* Personal Information */}
                    <div>
                      <label className="block text-sm text-muted-foreground mb-3">
                        Personal Information
                      </label>

                      <div className="space-y-3">
                        <div>
                          <input
                            type="text"
                            placeholder="Full Name *"
                            className={getInputClassName(
                              "full_name",
                              "w-full px-4 py-3 rounded-xl bg-white/5 outline-none text-sm"
                            )}
                            value={form.full_name}
                            onChange={(e) =>
                              handleChange(["full_name"], e.target.value)
                            }
                            data-error={showErrors && validationErrors.full_name}
                          />
                          {showErrors && validationErrors.full_name && (
                            <p className="text-xs text-red-400 mt-1 ml-1">
                              Full name is required
                            </p>
                          )}
                        </div>

                        <div>
                          <input
                            type="text"
                            placeholder="Role / Desired Job Title * (e.g., Frontend Developer)"
                            className={getInputClassName(
                              "role",
                              "w-full px-4 py-3 rounded-xl bg-white/5 outline-none text-sm"
                            )}
                            value={form.role}
                            onChange={(e) =>
                              handleChange(["role"], e.target.value)
                            }
                            data-error={showErrors && validationErrors.role}
                          />
                          {showErrors && validationErrors.role && (
                            <p className="text-xs text-red-400 mt-1 ml-1">
                              Role is required
                            </p>
                          )}
                        </div>

                        <div>
                          <input
                            type="email"
                            placeholder="Email Address *"
                            className={getInputClassName(
                              "email",
                              "w-full px-4 py-3 rounded-xl bg-white/5 outline-none text-sm"
                            )}
                            value={form.email}
                            onChange={(e) =>
                              handleChange(["email"], e.target.value)
                            }
                            data-error={showErrors && validationErrors.email}
                          />
                          {showErrors && validationErrors.email && (
                            <p className="text-xs text-red-400 mt-1 ml-1">
                              Email is required
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Phone Number (Optional)"
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                            value={form.phone}
                            onChange={(e) =>
                              handleChange(["phone"], e.target.value)
                            }
                          />

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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="LinkedIn Profile URL (Optional)"
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                            value={form.linkedin}
                            onChange={(e) =>
                              handleChange(["linkedin"], e.target.value)
                            }
                          />

                          <input
                            type="text"
                            placeholder="GitHub Profile URL (Optional)"
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                            value={form.github}
                            onChange={(e) =>
                              handleChange(["github"], e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Education */}
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
                          <input
                            type="text"
                            placeholder="Year"
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                            onChange={(e) =>
                              handleChange(
                                ["education", "tenth", "year"],
                                e.target.value,
                              )
                            }
                          />
                          <input
                            type="text"
                            placeholder="Marks %"
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                            onChange={(e) =>
                              handleChange(
                                ["education", "tenth", "percentage"],
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      </div>

                      {/* Class 12 / Diploma */}
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
                          <input
                            type="text"
                            placeholder="Year"
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                            onChange={(e) =>
                              handleChange(
                                ["education", "twelfthOrDiploma", "year"],
                                e.target.value,
                              )
                            }
                          />

                          <input
                            type="text"
                            placeholder="Percentage"
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                            onChange={(e) =>
                              handleChange(
                                ["education", "twelfthOrDiploma", "percentage"],
                                e.target.value,
                              )
                            }
                          />
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
                          <input
                            type="text"
                            placeholder="Year"
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                            onChange={(e) =>
                              handleChange(
                                ["education", "degree", "year"],
                                e.target.value,
                              )
                            }
                          />

                          <input
                            type="text"
                            placeholder="GPA / CGPA"
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                            onChange={(e) =>
                              handleChange(
                                ["education", "degree", "gpa"],
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Skills */}
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
                              "w-full px-4 py-3 rounded-xl bg-white/5 outline-none text-sm"
                            )}
                            value={form.skills.technical}
                            onChange={(e) =>
                              handleChange(
                                ["skills", "technical"],
                                e.target.value,
                              )
                            }
                            data-error={showErrors && validationErrors.technical}
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

                    {/* Experience (Optional for beginners, but available) */}
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

                    {/* Projects */}
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

                    {/* Certifications */}
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

                    {/* AI Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                      <div>
                        <p className="text-sm">Use AI Optimization</p>
                        <p className="text-xs text-muted-foreground">
                          Let AI enhance your resume content
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUseAI(!useAI)}
                        className={`relative w-12 h-6 rounded-full transition-all ${
                          useAI ? "bg-violet-500" : "bg-white/10"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                            useAI ? "translate-x-6" : ""
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Job Description Input */}
            <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm">
              <h3 className="text-xl mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400" />
                Job Description {userType === "beginner" && "(Optional)"}
              </h3>
              <textarea
                placeholder="Paste the job description here..."
                className="w-full h-40 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none resize-none text-sm"
              />
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
                    Generating...
                  </span>
                ) : userType === "experienced" ? (
                  "Analyze Match"
                ) : (
                  "Generate Resume"
                )}
              </button>
            </div>
          </motion.div>

          {/* Right Panel - Analysis Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* ATS Score Card (Experienced) or View Resume (Beginner) */}
            {userType === "experienced" ? (
              <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl mb-2">ATS Compatibility Score</h3>
                    <p className="text-sm text-muted-foreground">
                      Your resume's compatibility with Applicant Tracking
                      Systems
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30">
                    <CircleCheck className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400">Excellent</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Score Visualization */}
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
                            85%
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
                        <span className="text-green-400">92%</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full w-[92%] bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">
                          Format Score
                        </span>
                        <span className="text-cyan-400">88%</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full w-[88%] bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">
                          Experience Match
                        </span>
                        <span className="text-violet-400">78%</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full w-[78%] bg-gradient-to-r from-violet-500 to-purple-500 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
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
                      onClick={downloadPDF}
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

            {/* AI Suggestions (Experienced) or Suggested Projects (Beginner) */}
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
                  [
                    "Add more specific metrics to quantify your achievements",
                    'Include "TypeScript" in your technical skills section',
                    "Highlight your experience with agile methodologies",
                    "Add a brief summary section at the top of your resume",
                  ].map((suggestion, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/30 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs">{i + 1}</span>
                        </div>
                        <p className="text-sm">{suggestion}</p>
                      </div>
                    </div>
                  ))
                ) : projectSuggestions.length > 0 ? (
                  projectSuggestions.map((project, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/30 transition-colors"
                    >
                      {/* Project Title */}
                      <p className="text-sm font-medium">{project.title}</p>

                      {/* Project Bullets */}
                      {project.bullets?.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {project.bullets.map((bullet, idx) => (
                            <li key={idx} className="text-xs text-muted-foreground">
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
          </motion.div>
        </div>
      </div>
    </section>
  );
}