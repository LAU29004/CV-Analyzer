import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { Upload, Target, Clock, TrendingUp, Award, Rocket, ArrowLeft, Download, X, Home } from 'lucide-react';

type InputMode = 'resume' | 'manual';
type Screen = 'input' | 'results';

interface RoadmapGeneratorProps {
  onBack?: () => void;
}

export function RoadmapGenerator({ onBack }: RoadmapGeneratorProps) {
  const [currentScreen, setCurrentScreen] = useState<Screen>('input');
  const [inputMode, setInputMode] = useState<InputMode>('resume');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const commonSkills = [
    'React', 'TypeScript', 'Node.js', 'Python', 'JavaScript',
    'AWS', 'Docker', 'MongoDB', 'PostgreSQL', 'Git',
    'REST APIs', 'GraphQL', 'CI/CD', 'Kubernetes', 'Redux'
  ];

  const handleAddSkill = (skill: string) => {
    if (skill && !selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSelectedSkills(selectedSkills.filter(s => s !== skill));
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setCurrentScreen('results');
    }, 2000);
  };

  const roadmapData = [
    {
      label: 'Now',
      title: 'Current Position',
      role: 'Junior Developer',
      skills: ['React', 'JavaScript', 'HTML/CSS', 'Git'],
      icon: Target,
      color: 'violet'
    },
    {
      label: '6–12 months',
      title: 'Next Milestone',
      role: 'Mid-Level Developer',
      skills: ['TypeScript', 'Node.js', 'REST APIs', 'Testing'],
      icon: Clock,
      color: 'cyan'
    },
    {
      label: '2–3 years',
      title: 'Growth Phase',
      role: 'Senior Developer',
      skills: ['System Design', 'PostgreSQL', 'AWS', 'Microservices'],
      icon: TrendingUp,
      color: 'blue'
    },
    {
      label: '4–5 years',
      title: 'Leadership Track',
      role: 'Tech Lead',
      skills: ['Architecture', 'Team Leadership', 'CI/CD', 'Mentoring'],
      icon: Award,
      color: 'purple'
    },
    {
      label: '5+ years',
      title: 'Goal Achievement',
      role: 'Engineering Manager',
      skills: ['Strategic Planning', 'People Management', 'Stakeholder Communication'],
      icon: Rocket,
      color: 'violet'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-slate-900 py-20">
      <div className="max-w-6xl mx-auto px-6">
        {/* Back to Home Button */}
        {onBack && (
          <div className="mb-8">
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/30 transition-colors flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </button>
          </div>
        )}
        <AnimatePresence mode="wait">
          {currentScreen === 'input' ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl mx-auto"
            >
              {/* Header */}
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl mb-4 bg-gradient-to-r from-violet-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Generate Your Career Roadmap
                </h1>
                <p className="text-lg text-muted-foreground">
                  Tell us where you are now and where you want to go
                </p>
              </div>

              {/* Input Card */}
              <div className="p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl">
                <h2 className="text-2xl mb-6">Career Details</h2>

                {/* Toggle Selector */}
                <div className="flex gap-4 mb-8">
                  <button
                    onClick={() => setInputMode('resume')}
                    className={`flex-1 px-6 py-4 rounded-2xl transition-all ${
                      inputMode === 'resume'
                        ? 'bg-gradient-to-r from-violet-500/20 to-cyan-500/20 border-2 border-violet-500/50'
                        : 'bg-white/5 border border-white/10 hover:border-white/20'
                    }`}
                  >
                    <Upload className={`w-5 h-5 mx-auto mb-2 ${inputMode === 'resume' ? 'text-violet-400' : 'text-muted-foreground'}`} />
                    <span className={inputMode === 'resume' ? 'text-violet-400' : 'text-muted-foreground'}>
                      Upload Resume
                    </span>
                  </button>
                  <button
                    onClick={() => setInputMode('manual')}
                    className={`flex-1 px-6 py-4 rounded-2xl transition-all ${
                      inputMode === 'manual'
                        ? 'bg-gradient-to-r from-violet-500/20 to-cyan-500/20 border-2 border-violet-500/50'
                        : 'bg-white/5 border border-white/10 hover:border-white/20'
                    }`}
                  >
                    <Target className={`w-5 h-5 mx-auto mb-2 ${inputMode === 'manual' ? 'text-cyan-400' : 'text-muted-foreground'}`} />
                    <span className={inputMode === 'manual' ? 'text-cyan-400' : 'text-muted-foreground'}>
                      Enter Skills Manually
                    </span>
                  </button>
                </div>

                {/* Resume Mode */}
                {inputMode === 'resume' ? (
                  <div className="mb-6">
                    <label className="block text-sm text-muted-foreground mb-3">Upload Your Resume</label>
                    <div className="border-2 border-dashed border-violet-500/30 rounded-2xl p-12 text-center hover:border-violet-500/50 transition-colors cursor-pointer group">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 p-4 group-hover:scale-110 transition-transform">
                        <Upload className="w-full h-full text-white" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Click or drag to upload your resume
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF only, up to 10MB
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Manual Mode */
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-3">Your Skills</label>
                      
                      {/* Selected Skills */}
                      {selectedSkills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {selectedSkills.map((skill, i) => (
                            <div
                              key={i}
                              className="px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/20 to-cyan-500/20 border border-violet-500/30 flex items-center gap-2"
                            >
                              <span className="text-sm">{skill}</span>
                              <button
                                onClick={() => handleRemoveSkill(skill)}
                                className="w-4 h-4 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Skill Input */}
                      <div className="relative mb-3">
                        <input
                          type="text"
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddSkill(skillInput);
                            }
                          }}
                          placeholder="Type a skill and press Enter"
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none"
                        />
                      </div>

                      {/* Common Skills */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Quick add:</p>
                        <div className="flex flex-wrap gap-2">
                          {commonSkills.filter(s => !selectedSkills.includes(s)).slice(0, 8).map((skill, i) => (
                            <button
                              key={i}
                              onClick={() => handleAddSkill(skill)}
                              className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-violet-500/30 transition-colors text-xs"
                            >
                              + {skill}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-muted-foreground mb-3">Experience Level</label>
                      <select className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none [&>option]:bg-slate-900 [&>option]:text-white">
                        <option value="" className="bg-slate-900 text-white">Select your level</option>
                        <option value="beginner" className="bg-slate-900 text-white">Beginner (0-2 years)</option>
                        <option value="intermediate" className="bg-slate-900 text-white">Intermediate (2-5 years)</option>
                        <option value="advanced" className="bg-slate-900 text-white">Advanced (5+ years)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Common Fields */}
                <div className="space-y-6 mt-6">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-3">Target Role</label>
                    <input
                      type="text"
                      placeholder="e.g., Senior Software Engineer, Engineering Manager"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-muted-foreground mb-3">Job Description (Optional)</label>
                    <textarea
                      placeholder="Paste a job description for more tailored recommendations..."
                      className="w-full h-32 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full mt-8 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-500 hover:shadow-lg hover:shadow-violet-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                >
                  {isGenerating ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Generating Your Roadmap...</span>
                    </div>
                  ) : (
                    <span className="text-lg">Generate My Roadmap</span>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {/* Header */}
              <div className="text-center mb-16">
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => setCurrentScreen('input')}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/30 transition-colors flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Edit Inputs
                  </button>
                  <button className="px-6 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 hover:shadow-lg hover:shadow-violet-500/50 transition-all flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download Roadmap
                  </button>
                </div>
                <h1 className="text-4xl md:text-5xl mb-4 bg-gradient-to-r from-violet-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Your Career Roadmap
                </h1>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  AI-generated personalized career path with actionable milestones and skill recommendations
                </p>
              </div>

              {/* Timeline */}
              <div className="relative max-w-4xl mx-auto">
                {/* Vertical Line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-500 via-cyan-500 to-blue-500 transform -translate-x-1/2" />

                {/* Timeline Cards */}
                <div className="space-y-16">
                  {roadmapData.map((milestone, index) => {
                    const Icon = milestone.icon;
                    const isLeft = index % 2 === 0;
                    
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: index * 0.2 }}
                        className={`relative flex items-center ${isLeft ? 'justify-end' : 'justify-start'}`}
                      >
                        {/* Timeline Node */}
                        <div className="absolute left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center z-10 border-4 border-slate-900 shadow-lg shadow-violet-500/50">
                          <Icon className="w-6 h-6 text-white" />
                        </div>

                        {/* Card */}
                        <div className={`w-[calc(50%-3rem)] ${isLeft ? 'pr-12' : 'pl-12'}`}>
                          <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/20 transition-all group">
                            <div className="flex items-start justify-between mb-4">
                              <div className={`px-3 py-1 rounded-full text-xs bg-${milestone.color}-500/10 border border-${milestone.color}-500/30 text-${milestone.color}-400`}>
                                {milestone.label}
                              </div>
                            </div>
                            
                            <h3 className="text-xl mb-2 group-hover:text-violet-400 transition-colors">
                              {milestone.title}
                            </h3>
                            
                            <p className="text-lg mb-4 bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                              {milestone.role}
                            </p>
                            
                            <div className="flex flex-wrap gap-2">
                              {milestone.skills.map((skill, i) => (
                                <span
                                  key={i}
                                  className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
