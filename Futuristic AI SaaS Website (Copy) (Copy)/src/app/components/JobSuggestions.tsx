import { motion } from "motion/react";
import { useState } from "react";
import {
  Sparkles,
  ExternalLink,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface JobForm {
  description: string;
  skills: string;
  experience: string;
  location: string;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export function FindJobs() {
  const [form, setForm] = useState<JobForm>({
    description: "",
    skills: "",
    experience: "Fresher",
    location: "",
  });

  const [error, setError] = useState("");

  const experienceMap: Record<string, string> = {
    Fresher: "1",
    "1-2 Years": "2",
    "3-5 Years": "3",
    "5+ Years": "4",
  };

  const getJobUrl = (platform: "linkedin" | "indeed" | "unstop") => {
    const role = encodeURIComponent(form.description);
    const location = encodeURIComponent(form.location);
    const expLevel = experienceMap[form.experience] ?? "1";

    const urls = {
      linkedin: `https://www.linkedin.com/jobs/search/?keywords=${role}&location=${location}&f_E=${expLevel}`,
      indeed: `https://www.indeed.com/jobs?q=${role}&l=${location}`,
      unstop: `https://unstop.com/jobs?search=${role}`,
    };

    return urls[platform];
  };

  const handleRedirect = (platform: "linkedin" | "indeed" | "unstop") => {
    if (!form.description.trim()) {
      setError("Please enter a job title or description.");
      return;
    }
    setError("");
    window.open(getJobUrl(platform), "_blank");
  };

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
            Enter your desired role and skills — search directly on LinkedIn,
            Indeed, or Unstop with one click.
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Job Title */}
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Job Title / Description
                  </label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
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
                    onChange={(e) =>
                      setForm({ ...form, experience: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm transition-colors [&>option]:bg-slate-900 [&>option]:text-white"
                  >
                    <option value="Fresher">Fresher</option>
                    <option value="1-2 Years">1–2 Years</option>
                    <option value="3-5 Years">3–5 Years</option>
                    <option value="5+ Years">5+ Years</option>
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                    placeholder="e.g. Pune, Maharashtra"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm transition-colors"
                  />
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

              {/* Platform Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* LinkedIn */}
                <button
                  onClick={() => handleRedirect("linkedin")}
                  className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[#0077B5]/20 border border-[#0077B5]/40 hover:bg-[#0077B5]/30 hover:border-[#0077B5]/60 transition-all text-sm font-medium text-blue-400"
                >
                  <ExternalLink className="w-4 h-4" />
                  Search LinkedIn
                </button>

                {/* Indeed */}
                <button
                  onClick={() => handleRedirect("indeed")}
                  className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-violet-500/10 border border-violet-500/30 hover:bg-violet-500/20 hover:border-violet-500/50 transition-all text-sm font-medium text-violet-400"
                >
                  <ExternalLink className="w-4 h-4" />
                  Search Indeed
                </button>

                {/* Unstop */}
                <button
                  onClick={() => handleRedirect("unstop")}
                  className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all text-sm font-medium text-cyan-400"
                >
                  <ExternalLink className="w-4 h-4" />
                  Search Unstop
                </button>
              </div>

            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}