import image_bd18504dab802b0e3e9a99c384519ddc29a1f4c8 from '@/assets/bd18504dab802b0e3e9a99c384519ddc29a1f4c8.png';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/30 bg-violet-500/10 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-violet-300">AI-Powered Resume Optimization</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl">
              <span className="block bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Smart Resumes.
              </span>
              <span className="block bg-gradient-to-r from-violet-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent mt-2">
                Smarter Careers.
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-xl">
              Leverage AI to optimize your resume for every job application, match with perfect opportunities, 
              and ace your interviews with personalized guidance.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => {
                  const el = document.getElementById('dashboard');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                aria-label="Scroll to Smart Dashboard"
                className="group px-8 py-4 rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-500 hover:shadow-2xl hover:shadow-violet-500/50 transition-all flex items-center justify-center gap-2"
              >
                Analyze My Resume
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 rounded-full border border-violet-500/30 bg-violet-500/5 backdrop-blur-sm hover:bg-violet-500/10 transition-all">
                Find Matching Jobs
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8">
              <div>
                <div className="text-3xl bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">50K+</div>
                <div className="text-sm text-muted-foreground">Resumes Analyzed</div>
              </div>
              <div>
                <div className="text-3xl bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">95%</div>
                <div className="text-sm text-muted-foreground">ATS Pass Rate</div>
              </div>
              <div>
                <div className="text-3xl bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">10K+</div>
                <div className="text-sm text-muted-foreground">Jobs Matched</div>
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
                src={image_bd18504dab802b0e3e9a99c384519ddc29a1f4c8}
                alt="AI Technology"
                className="w-full h-auto relative z-10 mix-blend-luminosity opacity-80"
              />
            </div>
            
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
