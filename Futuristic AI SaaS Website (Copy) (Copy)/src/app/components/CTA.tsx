import { motion } from 'motion/react';
import { Sparkles, ArrowRight } from 'lucide-react';

export function CTA() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-violet-500/20 to-cyan-500/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(139,92,246,0.2),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(6,182,212,0.2),transparent_50%)]" />
      
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative p-12 rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl"
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 blur-3xl -z-10" />
          
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/30 bg-violet-500/10 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-violet-300">Start Your Journey Today</span>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl">
              <span className="block bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Ready to Transform
              </span>
              <span className="block bg-gradient-to-r from-violet-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent mt-2">
                Your Career?
              </span>
            </h2>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of job seekers who've already optimized their resumes 
              and landed their dream jobs with CV Analyzer
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button className="group px-8 py-4 rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-500 hover:shadow-2xl hover:shadow-violet-500/50 transition-all flex items-center justify-center gap-2">
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 rounded-full border border-violet-500/30 bg-violet-500/5 backdrop-blur-sm hover:bg-violet-500/10 transition-all">
                Schedule a Demo
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span>Free to start</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span>No credit card</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
