import { motion } from 'motion/react';
import { FileText, Target, Files, Search, Shield, MessageSquare } from 'lucide-react';

const problems = [
  {
    icon: FileText,
    title: 'Inconsistent Resume Formatting',
    description: 'ATS systems reject poorly formatted resumes, costing you opportunities.',
    color: 'from-blue-500 to-violet-500'
  },
  {
    icon: Target,
    title: 'Missing Keywords',
    description: 'Your resume lacks the right keywords to pass automated screening.',
    color: 'from-violet-500 to-purple-500'
  },
  {
    icon: Files,
    title: 'Generic CV Submissions',
    description: 'One-size-fits-all resumes don\'t stand out in competitive markets.',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: Search,
    title: 'Overwhelming Job Search',
    description: 'Finding the right job match among thousands of listings is exhausting.',
    color: 'from-pink-500 to-cyan-500'
  },
  {
    icon: Shield,
    title: 'Fraudulent Job Listings',
    description: 'Scam job postings waste your time and put your data at risk.',
    color: 'from-cyan-500 to-teal-500'
  },
  {
    icon: MessageSquare,
    title: 'Poor Recruiter Communication',
    description: 'Lack of feedback and slow responses leave you in the dark.',
    color: 'from-teal-500 to-blue-500'
  }
];

export function Problems() {
  return (
    <section id="problems" className="relative py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-violet-500/5 to-background" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl mb-4">
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              The Job Search Struggle
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Job seekers face countless challenges in today's competitive market
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group relative"
            >
              <div className="relative p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-500">
                {/* Icon */}
                <div className="relative w-12 h-12 mb-4">
                  <div className={`absolute inset-0 bg-gradient-to-br ${problem.color} rounded-xl opacity-20 blur-xl group-hover:opacity-40 group-hover:blur-2xl transition-all duration-500`} />
                  <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${problem.color} p-2.5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                    <problem.icon className="w-full h-full text-white" />
                  </div>
                </div>

                <h3 className="text-xl mb-2 group-hover:text-white transition-colors duration-300">{problem.title}</h3>
                <p className="text-muted-foreground group-hover:text-gray-300 transition-colors duration-300">{problem.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}