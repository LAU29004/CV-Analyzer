// ExperiencedResumePage.tsx — Full page for Experienced users
import { motion, AnimatePresence } from "motion/react";
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload, Target, Sparkles, CircleCheck, TriangleAlert,
  FileText, AlertCircle, X, CheckCircle2, Lock, ArrowLeft,
  TrendingUp, TrendingDown, Minus, ArrowRight,
} from "lucide-react";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import axios from "axios";

import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type OptimizedResume = {
  header: { name: string; email?: string; phone?: string; location?: string; linkedin?: string; github?: string };
  summary: string;
  skills: { technical: string[]; soft: string[] };
  experience: any[]; projects: any[]; education: any[]; certifications_awards: string[];
};

type AtsResult = {
  overall: number;
  breakdown: { contact: number; sections: number; keywords: number; readability: number; formatting: number };
  missing: string[];
};

const ATS_MAX = { contact: 10, sections: 15, keywords: 25, readability: 15, formatting: 10 };

const toPercent = (value?: number, max?: number) => {
  if (!value || !max) return 0;
  return Math.round((value / max) * 100);
};

// ─────────────────────────────────────────────
// Spinner
// ─────────────────────────────────────────────
const Spinner = ({ size = "h-5 w-5" }: { size?: string }) => (
  <svg className={`animate-spin ${size}`} viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

// ─────────────────────────────────────────────
// ScoreCard
// ─────────────────────────────────────────────
type ScoreCardProps = { label: string; atsResult: AtsResult | null; variant: "before" | "after"; animate?: boolean };

const ScoreCard = ({ label, atsResult, variant, animate }: ScoreCardProps) => {
  const score = atsResult?.overall ?? 0;
  const gradientId = `gradient-${variant}-ats`;
  const color = variant === "before" ? { from: "#6b7280", to: "#9ca3af" } : { from: "#8b5cf6", to: "#06b6d4" };
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
      className={`flex-1 p-5 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border relative overflow-hidden ${variant === "before" ? "border-white/10" : "border-violet-500/30 shadow-lg shadow-violet-500/10"}`}
    >
      {variant === "after" && atsResult && <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-violet-500/10 blur-2xl pointer-events-none" />}
      <div className="flex items-center justify-between mb-4">
        <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${variant === "before" ? "border-white/10 bg-white/5 text-gray-400" : "border-violet-500/40 bg-violet-500/10 text-violet-300"}`}>{label}</span>
        {variant === "after" && atsResult && <CircleCheck className="w-4 h-4 text-green-400" />}
      </div>
      <div className="flex items-center justify-center mb-4">
        <div className="relative w-32 h-32">
          <RadialBarChart width={128} height={128} cx={64} cy={64} innerRadius={50} outerRadius={64} data={barData} startAngle={90} endAngle={-270}>
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
              <div className={`text-2xl font-bold bg-gradient-to-r ${variant === "before" ? "from-gray-400 to-gray-300" : "from-violet-400 to-cyan-400"} bg-clip-text text-transparent`}>
                {atsResult ? `${score}%` : "--"}
              </div>
              <div className="text-[9px] text-muted-foreground mt-0.5">ATS Score</div>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {breakdown.map(item => (
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
// DeltaBadge
// ─────────────────────────────────────────────
const DeltaBadge = ({ before, after }: { before: AtsResult | null; after: AtsResult | null }) => {
  if (!before || !after) return null;
  const delta = after.overall - before.overall;
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-1 shrink-0">
      <motion.div
        initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.2 }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border ${delta > 0 ? "bg-green-500/10 border-green-500/30 text-green-400" : delta < 0 ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-white/5 border-white/10 text-muted-foreground"}`}
      >
        {delta > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : delta < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
        {delta > 0 ? "+" : ""}{delta}%
      </motion.div>
      <ArrowRight className="w-4 h-4 text-white/20" />
    </div>
  );
};

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
export function ExperiencedResumePage() {
  const { user }      = useAuth();
  const { openLogin } = useAuthModal();
  const navigate      = useNavigate();

  // ── State ──
  const [resumeFile, setResumeFile]         = useState<File | null>(null);
  const [isDragging, setIsDragging]         = useState(false);
  const fileInputRef                        = useRef<HTMLInputElement>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading]               = useState(false);
  const [optimising, setOptimising]         = useState(false);
  const [atsResult, setAtsResult]           = useState<AtsResult | null>(null);
  const [aiSuggestions, setAiSuggestions]   = useState<string[]>([]);

  const showSingleAts = atsResult !== null;

  // ── Auth headers ──
  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    if (!user) return {};
    try { return { Authorization: `Bearer ${await user.getIdToken()}` }; } catch { return {}; }
  };

  // ── File handlers ──
  const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop      = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && /\.(pdf|doc|docx)$/i.test(file.name)) setResumeFile(file);
    else alert("Please upload a PDF, DOC, or DOCX file.");
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) setResumeFile(e.target.files[0]); };

  // ── Analyze ──
  const handleAnalyze = async () => {
    if (!resumeFile) { alert("Please upload your resume first"); return; }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("resume", resumeFile);
      const res = await axios.post("http://localhost:4000/api/public/analyze", formData, { headers: { "Content-Type": "multipart/form-data", ...await getAuthHeaders() } });
      const { atsScore, analysis } = res.data;
      setAtsResult(atsScore || null);
      setAiSuggestions(analysis?.weaknesses && Array.isArray(analysis.weaknesses) ? analysis.weaknesses : []);
    } catch (err) {
      if (axios.isAxiosError(err)) { if (err.response?.status === 401) { openLogin(); return; } alert(err.response?.data?.message || "Backend error."); }
      else alert("Unexpected error. Please try again.");
    } finally { setLoading(false); }
  };

  // ── Optimise → navigate to new page ──
  const handleOptimise = async () => {
    if (!resumeFile) { alert("Please upload your resume first"); return; }
    try {
      setOptimising(true);
      const formData = new FormData();
      formData.append("resume", resumeFile);
      if (jobDescription.trim()) formData.append("jobDescription", jobDescription.trim());
      const res = await axios.post("http://localhost:4000/api/public/analyze", formData, { headers: { "Content-Type": "multipart/form-data", ...await getAuthHeaders() } });
      const { optimizedResume, atsScore, certificationSuggestions } = res.data;

      // Navigate to the new OptimisedResumePage, passing all data via state
      navigate("/optimised-resume", {
        state: {
          optimizedResume: optimizedResume || null,
          beforeAts: atsResult,
          afterAts: atsScore || null,
          certificationSuggestions: certificationSuggestions || [],
          jobDescription: jobDescription.trim(),
        },
      });
    } catch (err) {
      if (axios.isAxiosError(err)) { if (err.response?.status === 401) { openLogin(); return; } alert(err.response?.data?.message || "Failed to optimise."); }
      else alert("Unexpected error. Please try again.");
    } finally { setOptimising(false); }
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <section className="relative py-20 bg-gradient-to-b from-background via-violet-500/5 to-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Back nav ── */}
        <motion.button
          initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </motion.button>

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
              <Upload className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Experienced Resume Analyzer</h1>
              <p className="text-sm text-muted-foreground">Upload your resume, get ATS scores, and AI optimisation</p>
            </div>
          </div>
        </motion.div>

        {/* ── Auth banner ── */}
        {!user && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-3 mb-8 px-5 py-2.5 rounded-full bg-amber-500/10 border border-amber-500/30">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-400">Login to download your optimised resume</p>
            <button onClick={openLogin} className="px-3 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs transition-colors">Login</button>
          </motion.div>
        )}

        {/* ── Main grid ── */}
        <div className="grid lg:grid-cols-3 gap-8">

          {/* ════ LEFT ════ */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="lg:col-span-1 space-y-6">

            {/* Upload card */}
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
                  className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300 p-8 flex flex-col items-center justify-center text-center ${isDragging ? "border-violet-400 bg-violet-500/10 scale-[1.02] shadow-lg shadow-violet-500/20" : "border-white/15 hover:border-violet-500/50 hover:bg-white/[0.03] bg-black/20"}`}
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
                    {["PDF", "DOC", "DOCX"].map(fmt => (
                      <span key={fmt} className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-white/5 border border-white/10 text-muted-foreground">{fmt}</span>
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
                      <p className="text-xs text-muted-foreground">{(resumeFile.size / 1024).toFixed(1)} KB • {resumeFile.name.split(".").pop()?.toUpperCase()}</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/25">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-xs text-green-400 font-medium">Ready</span>
                    </div>
                    <button type="button" onClick={() => setResumeFile(null)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-3 text-xs text-violet-400 hover:text-violet-300 transition-colors">Replace file</button>
                </div>
              )}
            </div>

            {/* Job Description + Actions */}
            <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm">
              <h3 className="text-xl mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400" />
                Job Description
              </h3>
              <textarea placeholder="Paste the job description here for a targeted analysis..." className="w-full h-40 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none resize-none text-sm" value={jobDescription} onChange={e => setJobDescription(e.target.value)} />
              <button
                className="w-full mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 hover:shadow-lg hover:shadow-violet-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                onClick={handleAnalyze}
                disabled={loading || !resumeFile}
              >
                {loading ? <span className="flex items-center justify-center gap-2"><Spinner />Analyzing...</span> : "Analyze Match"}
              </button>

              {/* Optimise button — navigates to new page */}
              <button
                className="w-full mt-3 px-6 py-3 rounded-xl border border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20 hover:border-violet-500/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-violet-300"
                onClick={handleOptimise}
                disabled={optimising || !resumeFile}
              >
                {optimising ? <><Spinner size="h-4 w-4" /> Optimising…</> : <><Sparkles className="w-4 h-4" /> Optimise Resume</>}
              </button>

              {optimising && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Optimising your resume, you'll be redirected shortly…
                </p>
              )}
            </div>
          </motion.div>

          {/* ════ RIGHT ════ */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="lg:col-span-2 space-y-6">

            {/* ATS Score Card */}
            <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl mb-1">ATS Compatibility Score</h3>
                  <p className="text-sm text-muted-foreground">Your resume's compatibility with Applicant Tracking Systems</p>
                </div>
                {showSingleAts && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30">
                    <CircleCheck className="w-4 h-4 text-violet-400" />
                    <span className="text-sm text-violet-300">Analyzed</span>
                  </div>
                )}
              </div>

              <AnimatePresence mode="wait">
                <motion.div key="single" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-center">
                      <div className="relative w-48 h-48">
                        <RadialBarChart width={192} height={192} cx={96} cy={96} innerRadius={76} outerRadius={96} data={[{ name: "ATS Score", value: atsResult?.overall ?? 0 }]} startAngle={90} endAngle={-270}>
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
                        { label: "Keyword Match",    value: toPercent(atsResult?.breakdown?.keywords, ATS_MAX.keywords),       colorClass: "text-green-400",  barClass: "from-green-500 to-emerald-500" },
                        { label: "Format Score",     value: toPercent(atsResult?.breakdown?.formatting, ATS_MAX.formatting),   colorClass: "text-cyan-400",   barClass: "from-cyan-500 to-blue-500" },
                        { label: "Experience Match", value: toPercent(atsResult?.breakdown?.readability, ATS_MAX.readability), colorClass: "text-violet-400", barClass: "from-violet-500 to-purple-500" },
                      ].map(item => (
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
                    Contact Info: {toPercent(atsResult?.breakdown?.contact, ATS_MAX.contact)}% • Sections: {toPercent(atsResult?.breakdown?.sections, ATS_MAX.sections)}%
                  </p>
                  {atsResult && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                      className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-violet-500/[0.07] border border-violet-500/20">
                      <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
                      <p className="text-xs text-violet-300">Click <span className="font-semibold">Optimise Resume</span> to open the full optimised view with PDF download.</p>
                    </motion.div>
                  )}
                  {!atsResult && !loading && (
                    <div className="h-32 flex items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/10">
                      <p className="text-sm text-muted-foreground">Upload a resume and click <span className="text-violet-400 font-medium">Analyze Match</span> to see your score</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* AI Suggestions */}
            <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm">
              <h3 className="text-xl mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                AI Suggestions
              </h3>
              <div className="space-y-3">
                {(atsResult?.missing?.length ?? 0) > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">ATS Improvements</p>
                    {atsResult?.missing?.map((m, i) => (
                      <div key={i} className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2">
                        <TriangleAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <span className="text-sm">{m}</span>
                      </div>
                    ))}
                  </div>
                )}
                {aiSuggestions.length > 0 && (
                  <div className="space-y-3 mt-4">
                    <p className="text-sm text-muted-foreground">AI Content Suggestions</p>
                    {aiSuggestions.map((s, i) => (
                      <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/30 transition-colors">
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
                    {atsResult ? "Your resume looks solid! No major optimization issues detected." : "Analyze your resume to see AI suggestions here."}
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