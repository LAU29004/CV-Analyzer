import { motion } from 'motion/react';
import { 
  FileCheck, 
  Target, 
  Briefcase, 
  TrendingUp, 
  BookOpen, 
  MessageCircle, 
  Users, 
  Workflow 
} from 'lucide-react';

const features = [
  {
    icon: FileCheck,
    title: 'Resume vs Job Comparison',
    description: 'AI-powered analysis comparing your resume against job requirements with detailed match scores.',
    gradient: 'from-blue-500 to-violet-500'
  },
  {
    icon: Target,
    title: 'ATS Checker with LaTeX',
    description: 'Ensure your resume passes ATS systems with our LaTeX template optimization.',
    gradient: 'from-violet-500 to-purple-500'
  },
  {
    icon: Briefcase,
    title: 'Smart Job Suggestions',
    description: 'Get personalized job recommendations based on your skills, experience, and career goals.',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    icon: TrendingUp,
    title: 'Career Enhancements',
    description: 'Personalized suggestions to improve your profile and stand out to recruiters.',
    gradient: 'from-pink-500 to-cyan-500'
  },
  {
    icon: BookOpen,
    title: 'Course Recommendations',
    description: 'Domain-specific course suggestions to upskill and bridge knowledge gaps.',
    gradient: 'from-cyan-500 to-teal-500'
  },
  {
    icon: MessageCircle,
    title: 'Interview Q&A Generator',
    description: 'Practice with AI-generated interview questions tailored to your target role.',
    gradient: 'from-teal-500 to-blue-500'
  },
  {
    icon: Users,
    title: 'Career Guidance',
    description: 'Expert AI-powered advice for interview preparation and career development.',
    gradient: 'from-blue-500 to-indigo-500'
  },
  {
    icon: Workflow,
    title: 'Career Roadmap Builder',
    description: 'Visualize your career path with personalized milestones and skill development plans.',
    gradient: 'from-indigo-500 to-violet-500'
  }
];

export function Features() {
  return (
    <section id="features" className="relative py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-blue-500/5 to-background" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/30 bg-violet-500/10 backdrop-blur-sm mb-6">
            <span className="text-sm text-violet-300">Powered by Advanced AI</span>
          </div>
          <h2 className="text-4xl sm:text-5xl mb-4">
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Intelligent Features
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to optimize your resume, find the perfect job, and accelerate your career
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
              className="group relative"
            >
              <div className="relative p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm hover:border-violet-500/30 transition-all duration-300 h-full hover:scale-105">
                {/* Glow Effect */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 blur-xl transition-opacity`} />
                
                {/* Icon */}
                <div className="relative w-14 h-14 mb-4">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-xl opacity-20 blur-lg`} />
                  <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} p-3 flex items-center justify-center`}>
                    <feature.icon className="w-full h-full text-white" />
                  </div>
                </div>

                <h3 className="text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
