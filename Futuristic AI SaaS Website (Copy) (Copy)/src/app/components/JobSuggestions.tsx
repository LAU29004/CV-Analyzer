import { motion } from "motion/react";
import { useState } from "react";
import {
  Sparkles,
  Briefcase,
  MapPin,
  DollarSign,
  ExternalLink,
  Lock,
  Search,
  Building2,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Job {
  title: string;
  company: string;
  location: string;
  salary: string;
  link: string;
  description?: string;
  source?: "JSearch" | "Indeed" | "Unstop" | "LinkedIn";
}

interface JobForm {
  description: string;
  skills: string;
  experience: string;
}

// ─────────────────────────────────────────────
// Reusable Job Card
// ─────────────────────────────────────────────
function JobCard({ job, index }: { job: Job; index: number }) {
  const sourceBadgeColor =
    job.source === "Unstop"
      ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
      : job.source === "LinkedIn"
      ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
      : "bg-violet-500/10 border-violet-500/30 text-violet-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="flex flex-col p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10 transition-all group"
    >
      {/* Source badge */}
      {job.source && (
        <span className={`self-start mb-3 px-2.5 py-1 rounded-full border text-xs font-medium ${sourceBadgeColor}`}>
          {job.source}
        </span>
      )}

      {/* Title */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
          <Briefcase className="w-5 h-5 text-cyan-400" />
        </div>
        <h4 className="text-base font-semibold leading-snug group-hover:text-cyan-300 transition-colors">
          {job.title}
        </h4>
      </div>

      {/* Meta */}
      <div className="space-y-2 flex-1 mb-5">
        {job.company && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="w-4 h-4 shrink-0 text-violet-400" />
            <span className="truncate">{job.company}</span>
          </div>
        )}
        {job.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 shrink-0 text-blue-400" />
            <span className="truncate">{job.location}</span>
          </div>
        )}
        {job.salary && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="w-4 h-4 shrink-0 text-green-400" />
            <span className="truncate">{job.salary}</span>
          </div>
        )}
        {job.description && (
          <p className="text-xs text-muted-foreground/70 line-clamp-2 pt-1">
            {job.description}
          </p>
        )}
      </div>

      {/* Apply button */}
      <a
        href={job.link}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 hover:from-cyan-500/30 hover:to-violet-500/30 hover:border-cyan-400/50 transition-all text-sm text-cyan-400 font-medium"
      >
        Apply Now
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export function FindJobs() {
  const { user } = useAuth();
  const { openLogin } = useAuthModal();

  const [form, setForm] = useState<JobForm>({
    description: "",
    skills: "",
    experience: "Fresher",
  });

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!user) {
      openLogin();
      return;
    }
    if (!form.description.trim()) {
      setError("Please enter a job title or description.");
      return;
    }

    setError("");
    setLoading(true);
    setHasSearched(true);
    setJobs([]);

    try {
      const res = await axios.post(
        "http://localhost:4000/api/jobSuggestions/generateJobSuggestions",
        form
      );
      setJobs(res.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Split results by source
  const globalJobs = jobs.filter((j) => j.source !== "Unstop");
  const unstopJobs = jobs.filter((j) => j.source === "Unstop");

  return (
    <section id="job-suggestions" className="relative py-24">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.08),transparent_70%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-cyan-400">AI Powered Tool</span>
          </div>
          <h2 className="text-4xl sm:text-5xl mb-4">
            <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
              Find Your Perfect Job Match
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Enter your desired role and skills — our AI will surface the most
            relevant job opportunities tailored just for you.
          </p>
        </motion.div>

        {/* ── Input Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto mb-12"
        >
          <div className="p-8 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm">
            <div className="space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Job Title */}
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Job Title / Description
                  </label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="e.g. Frontend Developer"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm transition-colors"
                  />
                </div>

                {/* Experience Level */}
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Experience Level
                  </label>
                  <select
                    value={form.experience}
                    onChange={(e) => setForm({ ...form, experience: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm transition-colors [&>option]:bg-slate-900 [&>option]:text-white"
                  >
                    <option value="Fresher">Fresher</option>
                    <option value="1-2 Years">1–2 Years</option>
                    <option value="3-5 Years">3–5 Years</option>
                    <option value="5+ Years">5+ Years</option>
                  </select>
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Skills{" "}
                  <span className="text-muted-foreground/60">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="e.g. React, TypeScript, Node.js"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm transition-colors"
                />
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                onClick={handleSearch}
                disabled={loading}
                className="w-full px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 hover:shadow-lg hover:shadow-violet-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Finding your best job matches…</span>
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {!user && <Lock className="w-4 h-4" />}
                    <Search className="w-4 h-4" />
                    Find Jobs
                  </span>
                )}
              </button>

              {!user && (
                <p className="text-center text-xs text-muted-foreground mt-2">
                  <span className="text-cyan-400">Login required</span> to
                  search for job suggestions
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Loading Skeleton ── */}
        {loading && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-52 rounded-2xl border border-white/10 bg-white/5 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* ── Results ── */}
        {!loading && jobs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            {/* Total count row */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-10">
              <h3 className="text-2xl">Job Matches</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">
                  {jobs.length} result{jobs.length !== 1 ? "s" : ""} found
                </span>
                {(["JSearch", "LinkedIn", "Unstop"] as const).map((src) => {
                  const count = jobs.filter((j) => j.source === src).length;
                  if (!count) return null;
                  const color =
                    src === "Unstop"
                      ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                      : src === "LinkedIn"
                      ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                      : "bg-violet-500/10 border-violet-500/30 text-violet-400";
                  return (
                    <span key={src} className={`px-2.5 py-1 rounded-full border text-xs ${color}`}>
                      {src} · {count}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* ── Section 1: Global Listings (JSearch / LinkedIn) ── */}
            {globalJobs.length > 0 && (
              <div className="mb-12">
                {/* Section header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-sm text-violet-400 font-medium">Global Listings</span>
                  </div>
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-muted-foreground">{globalJobs.length} jobs</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {globalJobs.map((job, index) => (
                    <JobCard key={`global-${index}`} job={job} index={index} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Section 2: Unstop ── */}
            {unstopJobs.length > 0 && (
              <div>
                {/* Section header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                    <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-sm text-cyan-400 font-medium">Unstop</span>
                  </div>
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-muted-foreground">{unstopJobs.length} jobs</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {unstopJobs.map((job, index) => (
                    <JobCard key={`unstop-${index}`} job={job} index={index} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Empty state ── */}
        {!loading && hasSearched && jobs.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-4xl mx-auto text-center py-16"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Briefcase className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground">
              No jobs found for your search. Try adjusting your title or skills.
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}