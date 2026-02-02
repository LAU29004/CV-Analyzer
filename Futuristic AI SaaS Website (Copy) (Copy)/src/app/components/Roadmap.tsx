import { motion } from 'motion/react';
import { CircleCheck, Clock, Target, TrendingUp, Award, Rocket } from 'lucide-react';

const milestones = [
  {
    icon: Target,
    title: 'Current Position',
    role: 'Junior Developer',
    skills: ['JavaScript', 'React', 'CSS'],
    status: 'completed',
    time: 'Now'
  },
  {
    icon: Clock,
    title: 'Next Milestone',
    role: 'Mid-Level Developer',
    skills: ['TypeScript', 'Node.js', 'Testing'],
    status: 'in-progress',
    time: '6-12 months'
  },
  {
    icon: TrendingUp,
    title: 'Growth Phase',
    role: 'Senior Developer',
    skills: ['System Design', 'Leadership', 'Architecture'],
    status: 'upcoming',
    time: '2-3 years'
  },
  {
    icon: Award,
    title: 'Leadership Track',
    role: 'Tech Lead',
    skills: ['Team Management', 'Strategy', 'Mentoring'],
    status: 'upcoming',
    time: '4-5 years'
  },
  {
    icon: Rocket,
    title: 'Goal Achievement',
    role: 'Engineering Manager',
    skills: ['Product Strategy', 'Hiring', 'Vision'],
    status: 'upcoming',
    time: '5+ years'
  }
];

interface RoadmapProps {
  onGenerateClick?: () => void;
}

export function Roadmap({ onGenerateClick }: RoadmapProps) {
  return (
    <section id="roadmap" className="relative py-24">
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
            <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Your Career Roadmap
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-generated personalized career path with actionable milestones and skill recommendations
          </p>
        </motion.div>

        <div className="relative">
          {/* Timeline Line */}
          <div className="hidden lg:block absolute top-0 bottom-0 left-1/2 w-0.5 bg-gradient-to-b from-violet-500/50 via-cyan-500/50 to-blue-500/50 -translate-x-1/2" />

          <div className="space-y-12">
            {milestones.map((milestone, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative flex items-center ${
                  index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                } flex-col lg:gap-8`}
              >
                {/* Content Card */}
                <div className={`w-full lg:w-[calc(50%-2rem)] ${index % 2 === 0 ? 'lg:text-right' : 'lg:text-left'}`}>
                  <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm hover:border-violet-500/30 transition-all duration-300">
                    <div className={`flex items-start gap-4 ${index % 2 === 0 ? 'lg:flex-row-reverse' : 'lg:flex-row'} flex-row`}>
                      {/* Icon */}
                      <div className="relative shrink-0">
                        <div className={`w-12 h-12 rounded-xl ${
                          milestone.status === 'completed' 
                            ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                            : milestone.status === 'in-progress'
                            ? 'bg-gradient-to-br from-violet-500 to-cyan-500'
                            : 'bg-gradient-to-br from-gray-500 to-gray-600'
                        } p-2.5 flex items-center justify-center`}>
                          <milestone.icon className="w-full h-full text-white" />
                        </div>
                      </div>

                      <div className={`flex-1 ${index % 2 === 0 ? 'lg:text-right' : 'lg:text-left'} text-left`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-violet-400">{milestone.time}</span>
                          {milestone.status === 'completed' && (
                            <CircleCheck className="w-4 h-4 text-green-400" />
                          )}
                        </div>
                        <h3 className="text-xl mb-1">{milestone.title}</h3>
                        <p className="text-lg text-violet-300 mb-3">{milestone.role}</p>
                        <div className={`flex flex-wrap gap-2 ${index % 2 === 0 ? 'lg:justify-end' : 'lg:justify-start'} justify-start`}>
                          {milestone.skills.map((skill, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-sm text-violet-300"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline Dot */}
                <div className="hidden lg:block absolute left-1/2 -translate-x-1/2">
                  <div className={`w-4 h-4 rounded-full ${
                    milestone.status === 'completed' 
                      ? 'bg-green-400' 
                      : milestone.status === 'in-progress'
                      ? 'bg-violet-400 animate-pulse'
                      : 'bg-gray-500'
                  } ring-4 ring-background`} />
                </div>

                {/* Spacer for opposite side */}
                <div className="hidden lg:block w-[calc(50%-2rem)]" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mt-16"
        >
          <button 
            onClick={onGenerateClick}
            className="px-8 py-4 rounded-full bg-gradient-to-r from-violet-500 via-cyan-500 to-blue-500 hover:shadow-2xl hover:shadow-violet-500/50 transition-all"
          >
            Generate My Roadmap
          </button>
        </motion.div>
      </div>
    </section>
  );
}
