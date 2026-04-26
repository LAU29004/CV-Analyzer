// Dashboard.tsx — Entry point: routes user to Beginner or Experienced page
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  User,
  Sparkles,
  ArrowRight,
  Zap,
  Target,
  FileText,
} from "lucide-react";

export function Dashboard() {
  const navigate = useNavigate();

  return (
    <section
      id="dashboard"
      className="relative min-h-screen py-12 md:py-16 lg:py-20 bg-gradient-to-b from-background via-violet-500/5 to-background flex items-center"
    >
      {/* Background decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* ── Header ── */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-stretch max-w-7xl mx-auto">
          <div className="flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left mb-8 lg:mb-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="text-sm text-violet-300 font-medium">
                  AI-Powered Resume Builder
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
                  Let's Build Your
                </span>
                <br />
                <span className="text-white">Perfect Resume</span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                Tell us about yourself and we'll tailor the experience to match
                your career stage
              </p>
            </motion.div>
            {/* ── Bottom stats strip ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-6 sm:gap-8 text-center lg:text-left"
            >
              {[
                {
                  icon: <FileText className="w-4 h-4" />,
                  label: "Resumes Generated",
                  value: "10K+",
                },
                {
                  icon: <Target className="w-4 h-4" />,
                  label: "Avg ATS Score",
                  value: "88%",
                },
                {
                  icon: <Zap className="w-4 h-4" />,
                  label: "Time to Build",
                  value: "< 2 min",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                    {stat.icon}
                    <span>{stat.label}</span>
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                    {stat.value}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
          <div className="flex flex-col items-center justify-center ">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5 w-full max-w-xl mx-auto">
              {/* ── Fresher / Beginner Card ── */}
              <motion.button
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/resume/beginner")}
                className="group relative text-left p-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm hover:border-cyan-500/40 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 overflow-hidden min-h-[300px]"
              >
                {/* Glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-cyan-500/0 group-hover:from-cyan-500/5 group-hover:to-transparent transition-all duration-500 rounded-3xl" />
                <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-cyan-500/5 blur-2xl group-hover:bg-cyan-500/10 transition-all duration-500" />

                <div className="relative">
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/30 flex items-center justify-center mb-5 group-hover:shadow-lg group-hover:shadow-cyan-500/20 transition-all duration-300">
                    <GraduationCap className="w-8 h-8 text-cyan-400" />
                  </div>

                  {/* Label */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                      Beginner / Fresher
                    </span>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-cyan-400 group-hover:translate-x-1 transition-all duration-300" />
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
                    I'm just starting out
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                    No professional experience? No problem. Fill in your details
                    — education, skills, and projects — and our AI will build a
                    stunning resume from scratch.
                  </p>

                  {/* Feature pills */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      "AI-Generated Resume",
                      "Project Suggestions",
                      "Cert Recommendations",
                    ].map((feat) => (
                      <span
                        key={feat}
                        className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-muted-foreground"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.button>

              {/* ── Experienced Card ── */}
              <motion.button
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/resume/experienced")}
                className="group relative text-left p-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm hover:border-violet-500/40 hover:shadow-2xl hover:shadow-violet-500/10 transition-all duration-300 overflow-hidden min-h-[300px]"
              >
                {/* Glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 to-violet-500/0 group-hover:from-violet-500/5 group-hover:to-transparent transition-all duration-500 rounded-3xl" />
                <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-violet-500/5 blur-2xl group-hover:bg-violet-500/10 transition-all duration-500" />

                <div className="relative">
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 border border-violet-500/30 flex items-center justify-center mb-5 group-hover:shadow-lg group-hover:shadow-violet-500/20 transition-all duration-300">
                    <User className="w-8 h-8 text-violet-400" />
                  </div>

                  {/* Label */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400">
                      Experienced
                    </span>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-violet-400 group-hover:translate-x-1 transition-all duration-300" />
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
                    I have work experience
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                    Upload your existing resume and let AI analyze, score, and
                    optimize it for any job description with a full ATS
                    compatibility report.
                  </p>

                  {/* Feature pills */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      "ATS Score",
                      "Before/After Compare",
                      "AI Optimisation",
                    ].map((feat) => (
                      <span
                        key={feat}
                        className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-muted-foreground"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
