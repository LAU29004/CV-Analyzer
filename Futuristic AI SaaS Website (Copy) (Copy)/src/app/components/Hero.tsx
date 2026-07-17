import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, CheckCircle2, FileSearch, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ImageWithFallback } from './figma/ImageWithFallback';
const imgLogo = new URL("../../assets/bd18504dab802b0e3e9a99c384519ddc29a1f4c8.png", import.meta.url).href;


export function Hero() {
  const navigate = useNavigate();
  const [proofIndex, setProofIndex] = useState(0);

  const rotatingProofPoints = [
    'Beat ATS filters with optimized keywords',
    'AI-tailored resume rewrites for every job',
    'Role-specific interview prep in minutes',
  ];

  const quickActions = [
    { label: 'Check ATS Score', path: '/dashboard', icon: FileSearch },
    { label: 'Find Matching Jobs', path: '/job-suggestions', icon: Target },
    { label: 'Practice Interview Q&A', path: '/interview-qa', icon: CheckCircle2 },
  ];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProofIndex((current) => (current + 1) % rotatingProofPoints.length);
    }, 2400);

    return () => window.clearInterval(timer);
  }, [rotatingProofPoints.length]);

  return (
    <section
      id="hero"
      aria-label="AI-Powered Resume Builder and ATS Checker"
      className="relative min-h-auto flex items-center justify-center overflow-hidden pt-3"
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-violet-500/10 to-cyan-500/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* { <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/30 bg-violet-500/10 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-violet-300">AI Resume Builder &amp; ATS Optimizer</span>
            </div> } */}

            {/* SEO: H1 with primary keyword */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl">
              <span className="block bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Land More Interviews with AI Resume Help
              </span>
              {/* <span className="block bg-gradient-to-r from-violet-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent mt-2">
                with AI Resume Help
              </span> */}
            </h1>

            {/* SEO: keyword-rich description */}
            <p className="text-sm text-muted-foreground max-w-xl">
              The #1 AI resume builder and ATS checker trusted by job seekers worldwide. Optimize your resume for
              applicant tracking systems, discover best-fit job listings, and ace interviews with AI-generated Q&amp;A
              tailored to your target role.
            </p>

            <motion.div
              key={rotatingProofPoints[proofIndex]}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">{rotatingProofPoints[proofIndex]}</span>
            </motion.div>

            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                onClick={() => navigate('/dashboard')}
                aria-label="Analyze my resume with AI ATS checker"
                className="group px-8 py-4 rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-500 hover:shadow-2xl hover:shadow-violet-500/50 transition-all flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Optimize My Resume Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <motion.button
                onClick={() => navigate('/job-suggestions')}
                aria-label="Find best-fit job listings matched to your resume"
                className="px-8 py-4 rounded-full border border-violet-500/30 bg-violet-500/5 backdrop-blur-sm hover:bg-violet-500/10 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Discover Matched Jobs
              </motion.button>
            </div>

            <div className="flex flex-wrap gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <motion.button
                    key={action.label}
                    onClick={() => navigate(action.path)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 transition-colors text-sm"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-4 h-4 text-violet-300" />
                    {action.label}
                  </motion.button>
                );
              })}
            </div>

            {/* SEO: trust signals with descriptive labels */}
            <div className="grid grid-cols-3 gap-8 pt-2">
              <div>
                <div className="text-3xl bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">2.1x</div>
                <div className="text-sm text-muted-foreground">More Interview Callbacks</div>
              </div>
              <div>
                <div className="text-3xl bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">98%</div>
                <div className="text-sm text-muted-foreground">ATS Pass Rate</div>
              </div>
              <div>
                <div className="text-3xl bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">60s</div>
                <div className="text-sm text-muted-foreground">Resume Audit &amp; Score</div>
              </div>
            </div>
          </motion.div>

          {/* Right Content - AI Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden border border-violet-500/20 shadow-2xl shadow-violet-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-violet-500/20 to-cyan-500/20 backdrop-blur-sm" />
              <ImageWithFallback
                src={imgLogo}
                alt="AI resume optimizer and ATS score checker dashboard screenshot"
                className="w-full h-auto relative z-10 mix-blend-luminosity opacity-80"
              />
            </div>

            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.35 }}
              className="absolute top-6 left-6 px-4 py-3 rounded-xl bg-black/35 backdrop-blur-xl border border-cyan-400/30"
            >
              <p className="text-xs uppercase tracking-wide text-cyan-300">ATS Compatibility Score</p>
              <p className="text-2xl bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">92 / 100</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.5 }}
              className="absolute bottom-6 right-6 px-4 py-3 rounded-xl bg-black/35 backdrop-blur-xl border border-violet-400/30"
            >
              <p className="text-xs uppercase tracking-wide text-violet-300">Resume Keyword Match</p>
              <p className="text-2xl bg-gradient-to-r from-violet-300 to-pink-300 bg-clip-text text-transparent">+38%</p>
            </motion.div>
            
            {/* Floating Elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -top-4 -right-4 p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 backdrop-blur-xl border border-blue-500/30"
            >
              <Sparkles className="w-8 h-8 text-blue-400" />
            </motion.div>
            
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
              className="absolute -bottom-4 -left-4 p-4 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 backdrop-blur-xl border border-violet-500/30"
            >
              <Sparkles className="w-8 h-8 text-violet-400" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}