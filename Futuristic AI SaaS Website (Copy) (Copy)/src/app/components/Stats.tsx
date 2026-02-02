import { motion } from 'motion/react';
import { Users, FileCheck, Briefcase, TrendingUp, Star } from 'lucide-react';

const stats = [
  {
    icon: Users,
    value: '50,000+',
    label: 'Active Users',
    description: 'Professionals trust our platform'
  },
  {
    icon: FileCheck,
    value: '200,000+',
    label: 'Resumes Analyzed',
    description: 'And counting every day'
  },
  {
    icon: Briefcase,
    value: '10,000+',
    label: 'Jobs Matched',
    description: 'Perfect opportunities found'
  },
  {
    icon: TrendingUp,
    value: '95%',
    label: 'Success Rate',
    description: 'Users land interviews faster'
  },
  {
    icon: Star,
    value: '4.9/5',
    label: 'Average Rating',
    description: 'From verified users'
  }
];

export function Stats() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-cyan-500/5 to-background" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl mb-4">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Trusted by Thousands
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join a growing community of successful job seekers and career changers
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative"
            >
              <div className="relative p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm hover:border-cyan-500/30 transition-all duration-300 text-center h-full">
                {/* Icon */}
                <div className="relative w-12 h-12 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl opacity-20 blur-lg group-hover:opacity-30 transition-opacity" />
                  <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 p-2.5 flex items-center justify-center">
                    <stat.icon className="w-full h-full text-white" />
                  </div>
                </div>

                <div className="text-3xl bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="mb-1">{stat.label}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Testimonial Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 grid md:grid-cols-3 gap-6"
        >
          {[
            {
              quote: "CV Analyzer helped me land my dream job in just 2 weeks! The AI suggestions were spot-on.",
              author: "Sarah Chen",
              role: "Software Engineer at Google"
            },
            {
              quote: "The ATS optimization feature is a game-changer. My resume now gets past the filters every time.",
              author: "Michael Rodriguez",
              role: "Product Manager at Amazon"
            },
            {
              quote: "I went from 0 interviews to 5 in a month. The job matching algorithm is incredibly accurate.",
              author: "Priya Sharma",
              role: "Data Scientist at Microsoft"
            }
          ].map((testimonial, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mb-4 italic">"{testimonial.quote}"</p>
              <div>
                <div className="text-sm">{testimonial.author}</div>
                <div className="text-xs text-muted-foreground">{testimonial.role}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
