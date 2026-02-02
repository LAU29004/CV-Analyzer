import { motion } from 'motion/react';
import { FileCheck, Target, Shield, MessageCircle, ArrowRight } from 'lucide-react';

const solutions = [
  {
    icon: FileCheck,
    title: 'Resume Tailoring',
    description: 'AI adapts your resume for each job application automatically',
    step: '01'
  },
  {
    icon: Target,
    title: 'Job-Resume Matching',
    description: 'Intelligent comparison shows how well you match with opportunities',
    step: '02'
  },
  {
    icon: Shield,
    title: 'Fraud Detection',
    description: 'Advanced AI identifies and filters out fraudulent job listings',
    step: '03'
  },
  {
    icon: MessageCircle,
    title: 'Real-Time Communication',
    description: 'Direct messaging with recruiters for instant feedback',
    step: '04'
  }
];

export function Solutions() {
  return (
    <section id="solutions" className="relative py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_70%)]" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl mb-4">
            <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
              AI-Powered Solutions
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your job search with intelligent automation and personalized guidance
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-violet-500/30 to-transparent -translate-y-1/2" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {solutions.map((solution, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -8 }}
                className="relative group"
              >
                <div className="relative p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm hover:border-violet-500/50 hover:shadow-2xl hover:shadow-violet-500/20 transition-all duration-500 h-full">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-6">
                    <div className="px-4 py-1 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 text-sm group-hover:scale-110 transition-transform duration-500">
                      {solution.step}
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="relative w-16 h-16 mb-6 mt-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-2xl opacity-20 blur-xl group-hover:opacity-40 group-hover:blur-2xl transition-all duration-500" />
                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 p-3 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                      <solution.icon className="w-full h-full text-white" />
                    </div>
                  </div>

                  <h3 className="text-xl mb-3 group-hover:text-white transition-colors duration-300">{solution.title}</h3>
                  <p className="text-muted-foreground mb-4 group-hover:text-gray-300 transition-colors duration-300">{solution.description}</p>
                  
                  <div className="flex items-center text-violet-400 text-sm hover:gap-2 transition-all cursor-pointer group/link">
                    Learn more
                    <ArrowRight className="w-4 h-4 ml-1 group-hover/link:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Arrow between steps (desktop only) */}
                {index < solutions.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 -translate-y-1/2 z-10">
                    <ArrowRight className="w-8 h-8 text-violet-500/30" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}