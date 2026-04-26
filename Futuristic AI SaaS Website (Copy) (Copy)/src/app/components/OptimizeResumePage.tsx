import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  FileText,
  Zap,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
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

type Props = {
  beforeAts: AtsResult | null;
  afterAts: AtsResult | null;
  expPdfUrl: string | null;
  onBack: () => void;
  onDownload: () => void;
  user: any;
  onLoginClick: () => void;
  resumeName?: string;
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const ATS_MAX = { contact: 10, sections: 15, keywords: 25, readability: 15, formatting: 10 };

const toPercent = (value?: number, max?: number) => {
  if (!value || !max) return 0;
  return Math.round((value / max) * 100);
};

const clamp = (n: number, min = 0, max = 100) => Math.min(Math.max(n, min), max);

// ─────────────────────────────────────────────
// Animated SVG circular progress
// ─────────────────────────────────────────────
interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  variant: "before" | "after";
  label?: string;
  animate?: boolean;
  delay?: number;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 200,
  strokeWidth = 14,
  variant,
  label,
  animate = true,
  delay = 0,
}) => {
  const [displayed, setDisplayed] = useState(0);
  const r = (size - strokeWidth) / 2;
  const circum = 2 * Math.PI * r;
  const offset = circum - (displayed / 100) * circum;
  const cx = size / 2;
  const cy = size / 2;
  const gradId = `cpGrad-${variant}`;

  useEffect(() => {
    if (!animate) { setDisplayed(value); return; }
    let start: number | null = null;
    const duration = 1400;
    const from = 0;
    const to = clamp(value);
    const step = (ts: number) => {
      if (!start) start = ts + delay * 1000;
      const elapsed = ts - start;
      if (elapsed < 0) { requestAnimationFrame(step); return; }
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(from + (to - from) * ease));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value, animate, delay]);

  const isGood = displayed >= 75;
  const isMed  = displayed >= 50 && displayed < 75;
  const beforeColors = { from: "#6b7280", to: "#9ca3af", glow: "rgba(107,114,128,0.3)" };
  const afterColors  = {
    from: isGood ? "#10b981" : isMed ? "#8b5cf6" : "#ef4444",
    to:   isGood ? "#06b6d4" : isMed ? "#06b6d4" : "#f97316",
    glow: isGood ? "rgba(16,185,129,0.3)" : isMed ? "rgba(139,92,246,0.3)" : "rgba(239,68,68,0.2)",
  };
  const colors = variant === "before" ? beforeColors : afterColors;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {variant === "after" && (
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-60 pointer-events-none"
          style={{ background: colors.glow }}
        />
      )}
      <svg width={size} height={size} className="rotate-[-90deg]">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colors.from} />
            <stop offset="100%" stopColor={colors.to} />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={`url(#${gradId})`} strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={circum} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.05s linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-4xl font-black tabular-nums"
          style={{
            background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {displayed}%
        </span>
        <span className="text-[11px] text-white/40 mt-0.5 tracking-widest uppercase">
          {label ?? "ATS Score"}
        </span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Breakdown bar row
// ─────────────────────────────────────────────
const BreakdownRow: React.FC<{
  label: string;
  before: number;
  after: number;
  color: string;
  delay?: number;
}> = ({ label, before, after, color, delay = 0 }) => {
  const delta = after - before;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/50">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-white/30">{before}%</span>
          <ChevronRight className="w-3 h-3 text-white/20" />
          <span style={{ color }}>{after}%</span>
          {delta !== 0 && (
            <span className={`text-[10px] font-bold ${delta > 0 ? "text-emerald-400" : "text-red-400"}`}>
              {delta > 0 ? "+" : ""}{delta}
            </span>
          )}
        </div>
      </div>
      <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-white/15 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${before}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: delay + 0.1 }}
        />
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}aa, ${color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${after}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: delay + 0.3 }}
        />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export const OptimizeResumePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get state from router
  const locationState = (location.state || {}) as any;
  const { beforeAts, afterAts, expPdfUrl, certificationSuggestions, resumeName } = locationState;
  
  // Mock user - replace with useAuth() hook
  const user = null;
  
  const [selectedLayout, setSelectedLayout] = useState<"standard" | "modern" | "minimal">("standard");

  // Fallback if no state
  if (!beforeAts || !afterAts) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-amber-400" />
          <h2 className="text-2xl font-bold mb-2">No optimization data</h2>
          <p className="text-muted-foreground mb-6">Please upload and analyze a resume first</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-semibold inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Create wrapper functions to match original prop interface
  const onBack = () => navigate(-1);
  const onDownload = async () => {
    if (!expPdfUrl) return;
    try {
      const response = await fetch(expPdfUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resume-optimized-${selectedLayout}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };
  const onLoginClick = () => {
    console.log("Open login modal");
  };
  
  const beforeScore = beforeAts?.overall ?? 0;
  const afterScore  = afterAts?.overall  ?? beforeScore;
  const delta       = afterScore - beforeScore;

  const breakdown = [
    { label: "Keywords",   before: toPercent(beforeAts?.breakdown?.keywords,   ATS_MAX.keywords),   after: toPercent(afterAts?.breakdown?.keywords,   ATS_MAX.keywords),   color: "#10b981" },
    { label: "Formatting", before: toPercent(beforeAts?.breakdown?.formatting, ATS_MAX.formatting), after: toPercent(afterAts?.breakdown?.formatting, ATS_MAX.formatting), color: "#06b6d4" },
    { label: "Sections",   before: toPercent(beforeAts?.breakdown?.sections,   ATS_MAX.sections),   after: toPercent(afterAts?.breakdown?.sections,   ATS_MAX.sections),   color: "#8b5cf6" },
    { label: "Contact",    before: toPercent(beforeAts?.breakdown?.contact,    ATS_MAX.contact),    after: toPercent(afterAts?.breakdown?.contact,    ATS_MAX.contact),    color: "#f59e0b" },
  ];

  return (
    <AnimatePresence>
      <motion.div
        key="optimise-page"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -24 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="fixed inset-0 z-[9999] min-h-screen bg-background text-white overflow-y-auto"
      >
        {/* ── Top bar ── */}
        <div className="sticky top-0 z-50 border-b border-white/[0.06] bg-background/80 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-white/50">Optimised</span>
            </div>

            {expPdfUrl ? (
              <button
                onClick={onDownload}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 hover:shadow-lg hover:shadow-violet-500/40 transition-all text-sm font-semibold"
              >
                {!user && <Lock className="w-4 h-4" />}
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            ) : (
              <div className="w-[130px]" />
            )}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="max-w-6xl mx-auto px-6 pt-12 pb-8">

          {/* Hero header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-semibold tracking-widest uppercase mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              AI Resume Optimisation Report
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
              Your Resume,{" "}
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Supercharged
              </span>
            </h1>
            {resumeName && (
              <p className="text-white/40 text-sm">
                <FileText className="w-3.5 h-3.5 inline mr-1 mb-0.5" />
                {resumeName}
              </p>
            )}
          </motion.div>

          {/* ── Score comparison ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-sm overflow-hidden mb-8"
          >
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-cyan-500/[0.08] blur-3xl pointer-events-none" />

            <div className="relative p-8 md:p-10">
              <div className="flex flex-col items-center">
                {/* Before / After labels */}
                <div className="flex w-full max-w-2xl mx-auto justify-between mb-2 px-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-white/30">Before</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-violet-300">After</span>
                </div>

                {/* Circles + delta */}
                <div className="flex items-center justify-center gap-6 md:gap-10 mb-8">
                  {/* BEFORE */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: -20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ delay: 0.35, type: "spring", stiffness: 200, damping: 22 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <div className="p-1 rounded-full border border-white/10">
                      <CircularProgress value={beforeScore} variant="before" size={180} strokeWidth={13} delay={0.2} />
                    </div>
                    <span className="text-xs text-white/30 uppercase tracking-widest font-semibold">Original</span>
                  </motion.div>

                  {/* Delta badge */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8, type: "spring", stiffness: 320, damping: 20 }}
                    className="flex flex-col items-center gap-2 shrink-0"
                  >
                    <div className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-base font-black border shadow-lg ${
                      delta > 0
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-emerald-500/20"
                        : delta < 0
                        ? "bg-red-500/10 border-red-500/30 text-red-300"
                        : "bg-white/5 border-white/10 text-white/30"
                    }`}>
                      {delta > 0 ? <TrendingUp className="w-4 h-4" /> : delta < 0 ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                      {delta > 0 ? "+" : ""}{delta}%
                    </div>
                    <span className="text-[10px] text-white/20 uppercase tracking-widest">Improvement</span>
                  </motion.div>

                  {/* AFTER */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ delay: 0.35, type: "spring", stiffness: 200, damping: 22 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <div className="p-1 rounded-full border border-violet-500/30 shadow-lg shadow-violet-500/10">
                      <CircularProgress value={afterScore} variant="after" size={180} strokeWidth={13} delay={0.5} />
                    </div>
                    <span className="text-xs text-violet-300 uppercase tracking-widest font-semibold">Optimised</span>
                  </motion.div>
                </div>

                {/* Breakdown bars */}
                <div className="w-full max-w-lg mx-auto space-y-3 border-t border-white/[0.06] pt-6">
                  <p className="text-xs text-white/30 uppercase tracking-widest mb-4">Score Breakdown</p>
                  {breakdown.map((row, i) => (
                    <BreakdownRow key={row.label} {...row} delay={0.6 + i * 0.08} />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Two-column: PDF preview + insights ── */}
          <div className="grid lg:grid-cols-5 gap-6">

            {/* Optimised PDF preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-3 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-transparent backdrop-blur-sm overflow-hidden"
            >
              <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-semibold">Optimised Resume Preview</span>
                </div>
                {expPdfUrl && (
                  <button
                    onClick={onDownload}
                    className="flex items-center gap-1.5 text-xs text-violet-300 hover:text-violet-200 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                )}
              </div>

              {expPdfUrl ? (
                <div className="relative h-[480px] bg-black/30">
                  <iframe
                    src={`${expPdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                    className={`w-full h-[700px] border-0 pointer-events-none ${!user ? "blur-sm" : ""}`}
                    scrolling="no"
                  />
                  {!user && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                      <div className="text-center p-8 rounded-2xl bg-black/80 border border-white/10 max-w-xs">
                        <Lock className="w-10 h-10 mx-auto mb-3 text-violet-400" />
                        <h3 className="text-base font-bold mb-2">Login to Download</h3>
                        <p className="text-xs text-white/50 mb-5">Create a free account to access your optimised resume</p>
                        <button
                          onClick={onLoginClick}
                          className="w-full px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 hover:shadow-lg hover:shadow-violet-500/30 transition-all text-sm font-semibold"
                        >
                          Login Now
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-[480px] flex items-center justify-center">
                  <div className="text-center">
                    <Sparkles className="w-12 h-12 text-white/10 mx-auto mb-3" />
                    <p className="text-sm text-white/30">Optimised resume will appear here</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Insights panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="lg:col-span-2 space-y-4"
            >
              {/* Quick stats */}
              <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-transparent backdrop-blur-sm p-5">
                <p className="text-xs text-white/30 uppercase tracking-widest mb-4">Quick Stats</p>
                <div className="space-y-3">
                  {[
                    { label: "ATS Score",  before: `${beforeScore}%`, after: `${afterScore}%`, good: afterScore >= 75 },
                    { label: "Keywords",   before: `${toPercent(beforeAts?.breakdown?.keywords,   ATS_MAX.keywords)}%`,   after: `${toPercent(afterAts?.breakdown?.keywords,   ATS_MAX.keywords)}%`,   good: toPercent(afterAts?.breakdown?.keywords,   ATS_MAX.keywords) >= 70 },
                    { label: "Formatting", before: `${toPercent(beforeAts?.breakdown?.formatting, ATS_MAX.formatting)}%`, after: `${toPercent(afterAts?.breakdown?.formatting, ATS_MAX.formatting)}%`, good: toPercent(afterAts?.breakdown?.formatting, ATS_MAX.formatting) >= 70 },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
                      <span className="text-xs text-white/40">{stat.label}</span>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-white/30 line-through">{stat.before}</span>
                        <span className={stat.good ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                          {stat.after}
                        </span>
                        {stat.good
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          : <AlertCircle  className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* What was improved */}
              <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-transparent backdrop-blur-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-violet-400" />
                  <p className="text-xs text-violet-300 uppercase tracking-widest font-semibold">What Was Improved</p>
                </div>
                <ul className="space-y-2.5">
                  {[
                    "Keyword density boosted for ATS parsers",
                    "Action verbs strengthened in bullet points",
                    "Section headings standardised",
                    "Contact information properly formatted",
                    "Skills section reorganised by relevance",
                  ].map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + i * 0.07 }}
                      className="flex items-start gap-2 text-xs text-white/60"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Layout Selector */}
              <div>
                <p className="text-xs text-white/30 uppercase tracking-widest mb-3">Resume Layout</p>
                <div className="flex gap-3">
                  {(["standard", "modern", "minimal"] as const).map((layout) => (
                    <button
                      key={layout}
                      onClick={() => setSelectedLayout(layout)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-all font-medium ${
                        selectedLayout === layout
                          ? "bg-violet-500 text-white border-violet-400 shadow-lg shadow-violet-500/30"
                          : "bg-white/5 text-white/60 border-white/10 hover:border-white/20"
                      }`}
                    >
                      {layout.charAt(0).toUpperCase() + layout.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Certification Suggestions */}
              {certificationSuggestions?.length > 0 && (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
                  <p className="text-xs text-white/30 uppercase tracking-widest mb-3">
                    Suggested Certifications
                  </p>
                  <ul className="space-y-2">
                    {certificationSuggestions.map((cert: string, i: number) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9 + i * 0.06 }}
                        className="text-xs text-white/60 flex items-start gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0 mt-1.5" />
                        {cert}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Still missing */}
              {(afterAts?.missing?.length ?? 0) > 0 && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-sm p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <p className="text-xs text-amber-300 uppercase tracking-widest font-semibold">Still Missing</p>
                  </div>
                  <ul className="space-y-2">
                    {afterAts!.missing.slice(0, 4).map((m: string, i: number) => (
                      <li key={i} className="text-xs text-white/50 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Download CTA */}
              <button
                onClick={onDownload}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-500 hover:shadow-xl hover:shadow-violet-500/30 transition-all font-semibold text-sm flex items-center justify-center gap-2"
              >
                {!user && <Lock className="w-4 h-4" />}
                <Download className="w-4 h-4" />
                Download Optimised Resume
              </button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
