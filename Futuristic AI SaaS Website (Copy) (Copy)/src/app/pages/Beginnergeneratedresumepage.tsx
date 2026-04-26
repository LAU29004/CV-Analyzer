// BeginnerGeneratedResumePage.tsx
// Dedicated result page for the beginner resume builder.
// Receives optimizedResume, projectSuggestions, certificationSuggestions via router state.
import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FileText, ArrowLeft, Lock, Sparkles, CheckCircle2, Sparkle,
  Download, LayoutTemplate, Eye, Lightbulb, GraduationCap,
} from "lucide-react";
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

type SuggestedProject = { title: string; bullets: string[] };
type ResumeTemplate   = "standard" | "modern" | "minimal";

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
// Template Tab Button
// ─────────────────────────────────────────────
const TemplateButton = ({
  template,
  selected,
  loading,
  onClick,
}: {
  template: ResumeTemplate;
  selected: boolean;
  loading: boolean;
  onClick: () => void;
}) => {
  const icons: Record<ResumeTemplate, React.ReactNode> = {
    standard: <LayoutTemplate className="w-4 h-4" />,
    modern:   <Sparkles className="w-4 h-4" />,
    minimal:  <Eye className="w-4 h-4" />,
  };
  const descriptions: Record<ResumeTemplate, string> = {
    standard: "Classic professional layout",
    modern:   "Contemporary with accents",
    minimal:  "Clean & distraction-free",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={loading}
      className={`relative flex flex-col items-center gap-2 px-5 py-4 rounded-xl text-xs transition-all border group ${
        selected
          ? "bg-cyan-500/20 border-cyan-500/60 text-cyan-300 shadow-lg shadow-cyan-500/10"
          : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20 hover:bg-white/[0.07]"
      }`}
    >
      {selected && (
        <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
      )}
      <span className={selected ? "text-cyan-400" : "text-muted-foreground group-hover:text-white/60 transition-colors"}>
        {icons[template]}
      </span>
      <span className="font-semibold uppercase tracking-wider">{template}</span>
      <span className="text-[10px] opacity-60 text-center">{descriptions[template]}</span>
      {loading && selected && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 backdrop-blur-sm">
          <Spinner size="h-4 w-4" />
        </div>
      )}
    </motion.button>
  );
};

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export function BeginnerGeneratedResumePage() {
  const { user }      = useAuth();
  const { openLogin } = useAuthModal();
  const navigate      = useNavigate();
  const location      = useLocation();

  // Pull data passed from BeginnerResumePage via router state
  const state = location.state as {
    optimizedResume:          OptimizedResume | null;
    projectSuggestions:       SuggestedProject[];
    certificationSuggestions: any[];
    jobDescription?:          string;
  } | null;

  const optimizedResume          = state?.optimizedResume          ?? null;
  const projectSuggestions       = state?.projectSuggestions       ?? [];
  const certificationSuggestions = state?.certificationSuggestions ?? [];

  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate>("standard");
  const [pdfUrl, setPdfUrl]                     = useState<string | null>(null);
  const [pdfLoading, setPdfLoading]             = useState(false);

  // ── Auth headers ──
  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    if (!user) return {};
    try { return { Authorization: `Bearer ${await user.getIdToken()}` }; } catch { return {}; }
  };

  // ── Generate PDF preview ──
  const generatePDF = async (template: ResumeTemplate) => {
    if (!optimizedResume?.header?.name) return;
    try {
      setPdfLoading(true);
      if (pdfUrl) { URL.revokeObjectURL(pdfUrl); setPdfUrl(null); }
      const res = await axios.post(
        "http://localhost:4000/api/public/export-pdf",
        { optimizedResume, template },
        { responseType: "blob", headers: await getAuthHeaders() }
      );
      setPdfUrl(URL.createObjectURL(new Blob([res.data], { type: "application/pdf" })));
    } catch { console.error("PDF preview failed"); }
    finally { setPdfLoading(false); }
  };

  // ── Download PDF ──
  const downloadPDF = async () => {
    if (!user) { openLogin(); return; }
    if (!optimizedResume) return;
    try {
      const res = await axios.post(
        "http://localhost:4000/api/public/export-pdf",
        { optimizedResume, template: selectedTemplate },
        { responseType: "blob", headers: await getAuthHeaders() }
      );
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(new Blob([res.data]));
      link.download = `${selectedTemplate}_resume.pdf`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } catch { alert("Failed to download PDF. Please try again."); }
  };

  // Generate PDF on mount + template change
  useEffect(() => {
    if (optimizedResume) generatePDF(selectedTemplate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate]);

  // ── Guard: redirect if no data ──
  if (!state || !optimizedResume) {
    return (
      <section className="relative py-20 bg-gradient-to-b from-background via-cyan-500/5 to-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <GraduationCap className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">No resume found</h2>
          <p className="text-muted-foreground mb-6">Please go back and complete the resume builder first.</p>
          <button
            onClick={() => navigate("/resume/beginner")}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 hover:shadow-lg hover:shadow-violet-500/50 transition-all font-medium"
          >
            Go to Resume Builder
          </button>
        </div>
      </section>
    );
  }

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <section className="relative py-20 bg-gradient-to-b from-background via-cyan-500/5 to-background min-h-screen">

      {/* Background glow blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/3 w-96 h-96 rounded-full bg-cyan-600/5 blur-[120px]" />
        <div className="absolute bottom-0 right-1/3 w-96 h-96 rounded-full bg-violet-600/5 blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">

        {/* ── Back nav ── */}
        <motion.button
          initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Builder
        </motion.button>

        {/* ── Page Header ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Your Resume is Ready!</h1>
                <p className="text-sm text-muted-foreground">AI-crafted resume with 3 template options — download as PDF</p>
              </div>
            </div>

            {/* Download CTA */}
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
              onClick={downloadPDF}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 hover:shadow-lg hover:shadow-violet-500/50 transition-all font-medium text-sm"
            >
              {!user && <Lock className="w-4 h-4" />}
              <Download className="w-4 h-4" />
              Download PDF
            </motion.button>
          </div>

          {/* Success pill */}
          {optimizedResume?.header?.name && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-4">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                {optimizedResume.header.name}'s resume generated successfully
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* ── Main Grid ── */}
        <div className="grid lg:grid-cols-3 gap-8">

          {/* ════ LEFT — Template Switcher ════ */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="lg:col-span-1 space-y-6">

            {/* Template picker */}
            <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-cyan-400" />
                Choose Template
              </h3>
              <p className="text-xs text-muted-foreground mb-5">Pick a format and see an instant live preview</p>
              <div className="grid grid-cols-3 gap-3">
                {(["standard", "modern", "minimal"] as const).map(t => (
                  <TemplateButton
                    key={t}
                    template={t}
                    selected={selectedTemplate === t}
                    loading={pdfLoading}
                    onClick={() => setSelectedTemplate(t)}
                  />
                ))}
              </div>

              {/* Summary preview */}
              {optimizedResume.summary && (
                <div className="mt-5 p-4 rounded-xl bg-cyan-500/[0.06] border border-cyan-500/20">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-2">Your Summary</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{optimizedResume.summary}</p>
                </div>
              )}
            </div>

            {/* Skills quick view */}
            {(optimizedResume.skills?.technical?.length > 0 || optimizedResume.skills?.soft?.length > 0) && (
              <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm">
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-widest">Skills in your resume</h3>
                {optimizedResume.skills.technical?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] text-cyan-400 mb-2 uppercase tracking-wider">Technical</p>
                    <div className="flex flex-wrap gap-1.5">
                      {optimizedResume.skills.technical.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {optimizedResume.skills.soft?.length > 0 && (
                  <div>
                    <p className="text-[10px] text-violet-400 mb-2 uppercase tracking-wider">Soft Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {optimizedResume.skills.soft.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* ════ RIGHT — PDF Preview + Projects + Certifications ════ */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="lg:col-span-2 space-y-6">

            {/* PDF Preview */}
            <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-cyan-400" />
                    Resume Preview
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5 capitalize">{selectedTemplate} template</p>
                </div>
                <button
                  onClick={downloadPDF}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 hover:shadow-lg hover:shadow-violet-500/50 transition-all text-sm"
                >
                  {!user && <Lock className="w-4 h-4" />}
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>

              <AnimatePresence mode="wait">
                {pdfLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="h-[500px] flex flex-col items-center justify-center rounded-xl border border-white/10 bg-black/20 gap-4"
                  >
                    <Spinner size="h-10 w-10" />
                    <p className="text-sm text-muted-foreground">Generating {selectedTemplate} template…</p>
                  </motion.div>
                ) : pdfUrl ? (
                  <motion.div
                    key={`pdf-${selectedTemplate}`}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="relative h-[500px] overflow-hidden rounded-xl border border-white/10 bg-black"
                  >
                    <iframe
                      src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                      className={`w-full h-[800px] border-0 pointer-events-none transition-all duration-300 ${!user ? "blur-sm" : ""}`}
                      scrolling="no"
                    />
                    {!user && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
                        <div className="text-center p-8 rounded-2xl bg-background/90 border border-white/10 max-w-xs mx-4">
                          <Lock className="w-10 h-10 mx-auto mb-3 text-cyan-400" />
                          <h3 className="text-lg font-semibold mb-2">Login to Download</h3>
                          <p className="text-sm text-muted-foreground mb-5">Create a free account to download your resume</p>
                          <button onClick={openLogin} className="w-full px-6 py-2.5 rounded-lg bg-gradient-to-r from-violet-500 to-cyan-500 hover:shadow-lg transition-all text-sm font-medium">Login Now</button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="h-[500px] flex items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/20"
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm text-muted-foreground">Generating your resume preview…</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Suggested Projects */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
              className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm"
            >
              <h3 className="text-xl mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-cyan-400" />
                Suggested Projects
              </h3>
              <div className="space-y-3">
                {projectSuggestions.length > 0 ? projectSuggestions.map((p, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.08 * i }}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-cyan-500/40 transition-colors">
                        <span className="text-xs font-bold text-cyan-400">{i + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{p.title}</p>
                        {p.bullets?.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {p.bullets.map((b, idx) => (
                              <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                <span className="text-cyan-500/60 mt-0.5">•</span>
                                {b}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )) : (
                  <div className="flex items-center justify-center h-20 rounded-xl border border-dashed border-white/10 bg-black/10">
                    <p className="text-sm text-muted-foreground">No project suggestions available.</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Certifications */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
              className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkle className="w-5 h-5 text-amber-400" />
                Recommended Certifications
              </h3>
              <div className="space-y-4">
                {certificationSuggestions.length > 0 ? certificationSuggestions.map((cert: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.1 * i }}
                    className="p-5 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-amber-500/30 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 group-hover:text-amber-300 transition-colors" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{cert.name}</p>
                        {(cert.organization || cert.provider) && (
                          <p className="text-xs text-violet-400 mt-1.5 font-medium">{cert.organization || cert.provider}</p>
                        )}
                        {cert.description && (
                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{cert.description}</p>
                        )}
                        {cert.level && (
                          <span className={`mt-2.5 inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                            cert.level === "Beginner"     ? "bg-green-500/20 text-green-300 border border-green-500/30"   :
                            cert.level === "Intermediate" ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"     :
                                                           "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          }`}>
                            {cert.level}
                          </span>
                        )}
                        {cert.skills?.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {cert.skills.map((s: string, idx: number) => (
                              <span key={idx} className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-muted-foreground">{s}</span>
                            ))}
                          </div>
                        )}
                        {cert.link && (
                          <a href={cert.link} target="_blank" rel="noopener noreferrer" className="mt-3 block text-xs text-violet-400 hover:text-violet-300 transition-colors">
                            View Certificate →
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )) : (
                  <div className="flex items-center justify-center h-24 rounded-xl border border-dashed border-white/10 bg-black/10">
                    <p className="text-sm text-muted-foreground">No certification recommendations available.</p>
                  </div>
                )}
              </div>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </section>
  );
}