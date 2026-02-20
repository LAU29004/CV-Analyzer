import { motion } from 'motion/react';
import { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Code, Users, Briefcase, MessageSquare } from 'lucide-react';

type QuestionType = 'technical' | 'behavioral' | 'hr' | 'coding';
type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface Question {
  type: QuestionType;
  difficulty: Difficulty;
  question: string;
  answer: string;
  follow_up: string; // ← matches your backend key (was "followUp" before)
}

const questionTypes = [
  { id: 'technical' as QuestionType, label: 'Technical', icon: Code },
  { id: 'behavioral' as QuestionType, label: 'Behavioral', icon: Users },
  { id: 'hr' as QuestionType, label: 'HR', icon: Briefcase },
  { id: 'coding' as QuestionType, label: 'Coding', icon: MessageSquare }
];

export function InterviewQA() {
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>(['technical']);
  const [jobRole, setJobRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');

  const toggleQuestionType = (type: QuestionType) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleAnswer = (index: number) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (!jobRole.trim() || !jobDescription.trim()) {
      setError('Please enter a job role and job description.');
      return;
    }
    if (selectedTypes.length === 0) {
      setError('Please select at least one question type.');
      return;
    }

    setError('');
    setIsGenerating(true);
    setQuestions([]);

    try {
      const res = await fetch('http://localhost:4000/api/interview/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobRole,
          jobDescription,
          experienceLevel,
          questionTypes: selectedTypes  // e.g. ["technical", "hr"]
        })
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to generate questions');
      }

      setQuestions(json.data.questions);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getDifficultyColor = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'Easy':   return 'bg-green-500/10 border-green-500/30 text-green-400';
      case 'Medium': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      case 'Hard':   return 'bg-red-500/10 border-red-500/30 text-red-400';
    }
  };

  const getTypeColor = (type: QuestionType) => {
    switch (type) {
      case 'technical':  return 'bg-violet-500/10 border-violet-500/30 text-violet-400';
      case 'behavioral': return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400';
      case 'hr':         return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      case 'coding':     return 'bg-purple-500/10 border-purple-500/30 text-purple-400';
    }
  };

  return (
    <section id="interview-qa" className="relative py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_70%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-4">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-sm text-violet-400">AI Powered Tool</span>
          </div>
          <h2 className="text-4xl sm:text-5xl mb-4">
            <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Generate Smart Interview Questions Instantly
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Enter your target job role and job description to generate personalized interview questions and model answers.
          </p>
        </motion.div>

        {/* Input Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto mb-12"
        >
          <div className="p-8 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Target Job Role</label>
                  <input
                    type="text"
                    value={jobRole}
                    onChange={e => setJobRole(e.target.value)}
                    placeholder="e.g. Frontend Developer"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Experience Level</label>
                  <select
                    value={experienceLevel}
                    onChange={e => setExperienceLevel(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm [&>option]:bg-slate-900 [&>option]:text-white"
                  >
                    <option value="">Select experience</option>
                    <option value="fresher">Fresher</option>
                    <option value="1-3">1-3 Years</option>
                    <option value="3-5">3-5 Years</option>
                    <option value="5+">5+ Years</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Job Description</label>
                <textarea
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here..."
                  className="w-full h-40 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none resize-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-3">Question Types</label>
                <div className="flex flex-wrap gap-3">
                  {questionTypes.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => toggleQuestionType(id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                        selectedTypes.includes(id)
                          ? 'bg-gradient-to-r from-violet-500/20 to-cyan-500/20 border border-violet-500/50 text-violet-400'
                          : 'bg-white/5 border border-white/10 text-muted-foreground hover:border-white/20'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error message */}
              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating || selectedTypes.length === 0}
                className="w-full px-8 py-4 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 hover:shadow-lg hover:shadow-violet-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Generating smart interview questions...</span>
                  </div>
                ) : (
                  <span>Generate Interview Questions</span>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Results */}
        {questions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto space-y-6"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl">Generated Questions</h3>
              <span className="text-sm text-muted-foreground">{questions.length} questions generated</span>
            </div>

            {questions.map((q, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm hover:border-violet-500/30 transition-all"
              >
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full border text-xs ${getTypeColor(q.type)}`}>
                    {q.type.charAt(0).toUpperCase() + q.type.slice(1)}
                  </span>
                  <span className={`px-3 py-1 rounded-full border text-xs ${getDifficultyColor(q.difficulty)}`}>
                    {q.difficulty}
                  </span>
                </div>

                <h4 className="text-lg mb-4">{q.question}</h4>

                <button
                  onClick={() => toggleAnswer(index)}
                  className="flex items-center gap-2 text-violet-400 hover:text-violet-300 transition-colors text-sm mb-3"
                >
                  {expandedQuestions.has(index) ? (
                    <><ChevronUp className="w-4 h-4" />Hide Model Answer</>
                  ) : (
                    <><ChevronDown className="w-4 h-4" />Show Model Answer</>
                  )}
                </button>

                {expandedQuestions.has(index) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-sm text-muted-foreground mb-2">Model Answer:</p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{q.answer}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-cyan-400 mt-1">Follow-up:</span>
                      <p className="text-sm text-muted-foreground italic">{q.follow_up}</p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}