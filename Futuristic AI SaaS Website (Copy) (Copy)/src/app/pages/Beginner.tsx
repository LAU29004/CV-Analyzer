// BeginnerResumePage.tsx — Multi-step wizard with horizontal stepper & separate panels
import { motion, AnimatePresence } from "motion/react";
import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap, FileText, AlertCircle, CheckCircle2, Sparkle,
  TriangleAlert, ArrowLeft, ArrowRight, User, BookOpen, Wrench,
  Briefcase, FolderGit2, Award, Target, ChevronRight, Plus, Trash2,
  Check, Loader2, Zap,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type EducationLevel = {
  level?: "10th" | "12th" | "Diploma" | "Undergraduate" | "Postgraduate";
  institution?: string; board?: string; degree?: string;
  gpa?: string; percentage?: string; year?: string;
};
type Experience  = { role: string; company: string; location: string; duration: string; bullets: string };
type Project     = { title: string; technologies: string; description: string };
type FormState   = {
  full_name: string; role: string; email: string; phone: string;
  location: string; linkedin: string; github: string;
  education: { tenth: EducationLevel; twelfthOrDiploma: EducationLevel; degree: EducationLevel };
  skills: { technical: string; soft: string };
  experience: Experience[];
  projects: Project[];
  certifications: string;
};
type OptimizedResume = {
  header: { name: string; email?: string; phone?: string; location?: string; linkedin?: string; github?: string };
  summary: string; skills: { technical: string[]; soft: string[] };
  experience: any[]; projects: any[]; education: any[]; certifications_awards: string[];
};
type ValidationErrors  = Record<string, boolean>;
type FieldFormatErrors = Record<string, string>;

// ─────────────────────────────────────────────
// Validators
// ─────────────────────────────────────────────
const validateEmail      = (v: string) => !v.trim() ? null : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Enter a valid email";
const validatePhone      = (v: string) => { if (!v.trim()) return null; const d = v.replace(/[\s\-()]/g,""); return !/^\d+$/.test(d) ? "Digits only" : d.length!==10 ? "Must be 10 digits" : null; };
const validateURL        = (v: string, l: string) => { if (!v.trim()) return null; try { const u = new URL(v.startsWith("http")?v:"https://"+v); return u.hostname.includes(".")?null:`Invalid ${l} URL`; } catch { return `Invalid ${l} URL`; } };
const validatePercentage = (v: string) => { if (!v.trim()) return null; const n=parseFloat(v); return isNaN(n)?"Must be a number":n<0||n>100?"0-100 only":null; };
const validateGPA        = (v: string) => { if (!v.trim()) return null; const n=parseFloat(v); return isNaN(n)?"Must be a number":n<0||n>10?"0-10 only":null; };
const validateYear       = (v: string) => { if (!v.trim()) return null; const n=parseInt(v,10); return isNaN(n)?"Invalid year":n<1950||n>2030?"1950-2030 only":null; };

// ─────────────────────────────────────────────
// Step definitions
// ─────────────────────────────────────────────
const STEPS = [
  { id: "personal",   label: "Personal",   icon: User,        color: "from-cyan-500 to-blue-500"    },
  { id: "education",  label: "Education",  icon: BookOpen,    color: "from-violet-500 to-purple-500" },
  { id: "skills",     label: "Skills",     icon: Wrench,      color: "from-emerald-500 to-teal-500"  },
  { id: "experience", label: "Experience", icon: Briefcase,   color: "from-orange-500 to-amber-500"  },
  { id: "projects",   label: "Projects",   icon: FolderGit2,  color: "from-pink-500 to-rose-500"     },
  { id: "extras",     label: "Extras",     icon: Award,       color: "from-yellow-500 to-orange-500" },
  { id: "jd",         label: "Job Match",  icon: Target,      color: "from-indigo-500 to-violet-500" },
];

// ─────────────────────────────────────────────
// Reusable UI atoms
// ─────────────────────────────────────────────
function Field({ label, error, required, children }: {
  label?: string; error?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-[11px] font-bold text-white/40 uppercase tracking-widest">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      {children}
      <AnimatePresence>
        {error && (
          <motion.p initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            className="text-xs text-red-400 flex items-center gap-1">
            <TriangleAlert className="w-3 h-3 shrink-0"/>{error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const IC = (hasErr?: boolean) =>
  `w-full px-4 py-3 rounded-xl bg-white/[0.04] border text-sm text-white placeholder-white/20 outline-none transition-all duration-200 focus:bg-white/[0.07] ${
    hasErr
      ? "border-red-500/60 focus:border-red-400/80"
      : "border-white/10 focus:border-violet-400/50 focus:ring-1 focus:ring-violet-500/15"
  }`;

function Inp(props: React.InputHTMLAttributes<HTMLInputElement> & { hasErr?: boolean }) {
  const { hasErr, className, ...rest } = props;
  return <input {...rest} className={IC(hasErr)}/>;
}

function TA(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { hasErr?: boolean }) {
  const { hasErr, className, ...rest } = props;
  return <textarea {...rest} className={IC(hasErr) + " resize-none leading-relaxed"}/>;
}

function PanelHeader({ icon: Icon, gradient, title, subtitle }: {
  icon: React.ElementType; gradient: string; title: string; subtitle: string;
}) {
  return (
    <div className="flex items-center gap-4 mb-6 pb-5 border-b border-white/[0.06]">
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg shrink-0`}>
        <Icon className="w-6 h-6 text-white"/>
      </div>
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
        <p className="text-sm text-white/35 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function TagRow({ text, color }: { text: string; color: string }) {
  const tags = text.split(",").map(s=>s.trim()).filter(Boolean);
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {tags.map((t,i) => (
        <motion.span key={t+i} initial={{scale:0.7,opacity:0}} animate={{scale:1,opacity:1}}
          transition={{delay:i*0.03}}
          className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}>
          {t}
        </motion.span>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export function BeginnerResumePage() {
  const { user }      = useAuth();
  const { openLogin } = useAuthModal();
  const navigate      = useNavigate();

  const [step, setStep]           = useState(0);
  const [direction, setDirection] = useState(1);
  const [higherEd, setHigherEd]   = useState<"class12"|"diploma">("class12");
  const [summaryOptions, setSummaryOptions] = useState<string[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<string|null>(null);
  const [loading, setLoading]     = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [showErrors, setShowErrors] = useState(false);
  const [formatErrors, setFormatErrors] = useState<FieldFormatErrors>({});
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const [form, setForm] = useState<FormState>({
    full_name:"", role:"", email:"", phone:"", location:"", linkedin:"", github:"",
    education:{ tenth:{}, twelfthOrDiploma:{}, degree:{} },
    skills:{ technical:"", soft:"" },
    experience:[], projects:[], certifications:"",
  });

  const getAuthHeaders = async (): Promise<Record<string,string>> => {
    if (!user) return {};
    try { return { Authorization: `Bearer ${await user.getIdToken()}` }; } catch { return {}; }
  };

  const runFormatValidation = useCallback((next: FormState) => {
    const e: FieldFormatErrors = {};
    const chk = (k:string, v:string|null) => { if (v) e[k]=v; };
    chk("email",                       validateEmail(next.email));
    chk("phone",                       validatePhone(next.phone));
    chk("linkedin",                    validateURL(next.linkedin,"LinkedIn"));
    chk("github",                      validateURL(next.github,"GitHub"));
    chk("tenth.percentage",            validatePercentage(next.education.tenth.percentage||""));
    chk("tenth.year",                  validateYear(next.education.tenth.year||""));
    chk("twelfthOrDiploma.percentage", validatePercentage(next.education.twelfthOrDiploma.percentage||""));
    chk("twelfthOrDiploma.year",       validateYear(next.education.twelfthOrDiploma.year||""));
    chk("degree.gpa",                  validateGPA(next.education.degree.gpa||""));
    chk("degree.year",                 validateYear(next.education.degree.year||""));
    setFormatErrors(e);
  }, []);

  const validateStep = (s: number): boolean => {
    const errs: ValidationErrors = {};
    if (s===0) {
      if (!form.full_name.trim()) errs.full_name=true;
      if (!form.role.trim())      errs.role=true;
      if (!form.email.trim())     errs.email=true;
    }
    if (s===1) {
      if (!form.education.tenth.institution?.trim()) errs.tenth_institution=true;
      if (!form.education.tenth.board?.trim())       errs.tenth_board=true;
      if (!form.education.tenth.percentage?.trim())  errs.tenth_percentage=true;
      if (!form.education.tenth.year?.trim())        errs.tenth_year=true;
    }
    if (s===2) {
      if (!form.skills.technical.trim()) errs.technical=true;
    }
    setValidationErrors(errs); setShowErrors(true);
    return Object.keys(errs).length===0;
  };

  const goTo = (target: number) => {
    if (target > step) {
      if (!validateStep(step)) return;
      setCompletedSteps(p => new Set([...p, step]));
    }
    setDirection(target > step ? 1 : -1);
    setStep(target);
    setShowErrors(false);
    setValidationErrors({});
  };

  const handleChange = (path: (string|number)[], value: string) => {
    if (path[0]==="role"||path[0]==="skills") { setSelectedSummary(null); setSummaryOptions([]); }
    setForm(prev => {
      const next = structuredClone(prev); let ref:any=next;
      path.forEach((k,i)=>{ if(i===path.length-1) ref[k]=value; else{ ref[k]=ref[k]??{}; ref=ref[k]; }});
      runFormatValidation(next); return next;
    });
  };

  const addExp    = () => setForm(p=>({...p,experience:[...p.experience,{role:"",company:"",location:"",duration:"",bullets:""}]}));
  const remExp    = (i:number) => setForm(p=>({...p,experience:p.experience.filter((_,idx)=>idx!==i)}));
  const updExp    = (i:number,f:keyof Experience,v:string) => setForm(p=>({...p,experience:p.experience.map((e,idx)=>idx===i?{...e,[f]:v}:e)}));
  const addProj   = () => setForm(p=>({...p,projects:[...p.projects,{title:"",technologies:"",description:""}]}));
  const remProj   = (i:number) => setForm(p=>({...p,projects:p.projects.filter((_,idx)=>idx!==i)}));
  const updProj   = (i:number,f:keyof Project,v:string) => setForm(p=>({...p,projects:p.projects.map((pr,idx)=>idx===i?{...pr,[f]:v}:pr)}));

  const buildPayload = () => {
    const edu: EducationLevel[] = [];
    if (form.education.tenth?.institution) edu.push({level:"10th",...form.education.tenth});
    if (form.education.twelfthOrDiploma?.institution) edu.push({level:higherEd==="class12"?"12th":"Diploma",...form.education.twelfthOrDiploma});
    if (form.education.degree?.institution) edu.push({level:"Undergraduate",...form.education.degree});
    return {
      full_name:form.full_name, role:form.role, email:form.email,
      phone:form.phone||undefined, location:form.location||undefined,
      linkedin:form.linkedin||undefined, github:form.github||undefined,
      skills:form.skills.technical.split(",").map(s=>s.trim()).filter(Boolean),
      softSkills:form.skills.soft?form.skills.soft.split(",").map(s=>s.trim()).filter(Boolean):undefined,
      experience:form.experience.filter(e=>e.role&&e.company&&e.duration).map(e=>({...e,bullets:e.bullets?e.bullets.split("\n").filter(l=>l.trim()):[]})),
      projects:form.projects.filter(p=>p.title?.trim()).map(p=>({title:p.title.trim(),technologies:p.technologies.split(",").map(t=>t.trim()).filter(Boolean),description:p.description.split("\n").map(l=>l.trim()).filter(Boolean)})),
      education:edu,
      certifications:form.certifications?form.certifications.split("\n").map(c=>c.trim()).filter(Boolean):undefined,
      useAI:true, jobDescription:jobDescription||undefined, summary:selectedSummary||undefined,
    };
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      if (Object.keys(formatErrors).length>0) { alert("Fix highlighted errors first."); return; }
      const payload = buildPayload();
      if (!selectedSummary) {
        const res = await axios.post("http://localhost:4000/api/public/summaries",
          {useAI:true,role:form.role,skills:payload.skills,experienceCount:(payload.experience as any[])?.length||0,education:payload.education},
          {headers:await getAuthHeaders()});
        setSummaryOptions(res.data.summaries);
        return;
      }
      const res = await axios.post("http://localhost:4000/api/public/create-resume",payload,{headers:await getAuthHeaders()});
      const {optimizedResume}=res.data;
      navigate("/beginner-generated-resume",{
        state:{
          optimizedResume:{...optimizedResume,summary:selectedSummary},
          projectSuggestions:res.data.projectSuggestions||[],
          certificationSuggestions:res.data.certificationsRecommended||[],
          jobDescription:jobDescription||"",
        },
      });
    } catch(err) {
      if (axios.isAxiosError(err)) { if(err.response?.status===401){openLogin();return;} alert(err.response?.data?.message||"Error."); }
      else alert("Unexpected error.");
    } finally { setLoading(false); }
  };

  const ve = (k:string) => showErrors && validationErrors[k];
  const fe = (k:string) => formatErrors[k];

  // ─── Panel content per step ────────────────────────────────────────────
  const stepId = STEPS[step].id;

  const renderPanel = () => {
    switch(stepId) {

      case "personal": return (
        <div className="space-y-5">
          <PanelHeader icon={User} gradient="from-cyan-500 to-blue-500"
            title="Personal Information" subtitle="Who are you? Let recruiters find you." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full Name" required error={ve("full_name")?"Full name is required":undefined}>
              <Inp placeholder="e.g. Rahul Sharma" hasErr={!!ve("full_name")}
                value={form.full_name} onChange={e=>handleChange(["full_name"],e.target.value)}/>
            </Field>
            <Field label="Desired Role" required error={ve("role")?"Role is required":undefined}>
              <Inp placeholder="e.g. Frontend Developer" hasErr={!!ve("role")}
                value={form.role} onChange={e=>handleChange(["role"],e.target.value)}/>
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Email Address" required error={ve("email")?"Email is required":fe("email")}>
              <Inp type="email" placeholder="you@example.com" hasErr={!!ve("email")||!!fe("email")}
                value={form.email} onChange={e=>handleChange(["email"],e.target.value)}/>
            </Field>
            <Field label="Phone Number" error={fe("phone")}>
              <Inp placeholder="10-digit number" hasErr={!!fe("phone")}
                value={form.phone} onChange={e=>handleChange(["phone"],e.target.value)}/>
            </Field>
          </div>
          <Field label="Location">
            <Inp placeholder="City, State (e.g. Pune, Maharashtra)"
              value={form.location} onChange={e=>handleChange(["location"],e.target.value)}/>
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="LinkedIn URL" error={fe("linkedin")}>
              <Inp placeholder="linkedin.com/in/yourname" hasErr={!!fe("linkedin")}
                value={form.linkedin} onChange={e=>handleChange(["linkedin"],e.target.value)}/>
            </Field>
            <Field label="GitHub URL" error={fe("github")}>
              <Inp placeholder="github.com/yourname" hasErr={!!fe("github")}
                value={form.github} onChange={e=>handleChange(["github"],e.target.value)}/>
            </Field>
          </div>
        </div>
      );

      case "education": return (
        <div className="space-y-5">
          <PanelHeader icon={BookOpen} gradient="from-violet-500 to-purple-500"
            title="Education" subtitle="Your academic background" />

          {/* 10th */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-500/8 to-purple-500/4 border border-violet-500/18 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-500/25 border border-violet-500/35 flex items-center justify-center text-[11px] font-bold text-violet-300">10</div>
              <span className="text-sm font-semibold text-violet-300">Class 10 <span className="text-red-400">*</span></span>
            </div>
            <Field label="School Name" required error={ve("tenth_institution")?"Required":undefined}>
              <Inp placeholder="e.g. Shrideorao Dada Highschool" hasErr={!!ve("tenth_institution")}
                onChange={e=>handleChange(["education","tenth","institution"],e.target.value)}/>
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Board" required error={ve("tenth_board")?"Required":undefined}>
                <Inp placeholder="SSC / CBSE" hasErr={!!ve("tenth_board")}
                  onChange={e=>handleChange(["education","tenth","board"],e.target.value)}/>
              </Field>
              <Field label="Year" required error={ve("tenth_year")||fe("tenth.year")?(fe("tenth.year")||"Required"):undefined}>
                <Inp placeholder="2019" hasErr={!!ve("tenth_year")||!!fe("tenth.year")}
                  onChange={e=>handleChange(["education","tenth","year"],e.target.value)}/>
              </Field>
              <Field label="Percentage" required error={ve("tenth_percentage")||fe("tenth.percentage")?(fe("tenth.percentage")||"Required"):undefined}>
                <Inp placeholder="85.4" hasErr={!!ve("tenth_percentage")||!!fe("tenth.percentage")}
                  onChange={e=>handleChange(["education","tenth","percentage"],e.target.value)}/>
              </Field>
            </div>
          </div>

          {/* 12th / Diploma */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/6 to-indigo-500/4 border border-purple-500/15 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                {(["class12","diploma"] as const).map(opt=>(
                  <button key={opt} type="button" onClick={()=>setHigherEd(opt)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      higherEd===opt
                        ? "bg-violet-500/25 border border-violet-400/45 text-violet-300 shadow-sm"
                        : "bg-white/5 border border-white/10 text-white/35 hover:text-white/60 hover:border-white/20"
                    }`}>{opt==="class12"?"Class 12":"Diploma"}
                  </button>
                ))}
              </div>
              <span className="text-xs text-white/25">Optional</span>
            </div>
            <Field label={higherEd==="class12"?"School / College":"College / Institute"}>
              <Inp placeholder={higherEd==="class12"?"e.g. DPS Pune":"e.g. Govt Polytechnic Amravati"}
                onChange={e=>handleChange(["education","twelfthOrDiploma","institution"],e.target.value)}/>
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Board">
                <Inp placeholder="HSC / CBSE" onChange={e=>handleChange(["education","twelfthOrDiploma","board"],e.target.value)}/>
              </Field>
              <Field label="Year" error={fe("twelfthOrDiploma.year")}>
                <Inp placeholder="2021" hasErr={!!fe("twelfthOrDiploma.year")}
                  onChange={e=>handleChange(["education","twelfthOrDiploma","year"],e.target.value)}/>
              </Field>
              <Field label="Percentage" error={fe("twelfthOrDiploma.percentage")}>
                <Inp placeholder="78.2" hasErr={!!fe("twelfthOrDiploma.percentage")}
                  onChange={e=>handleChange(["education","twelfthOrDiploma","percentage"],e.target.value)}/>
              </Field>
            </div>
          </div>

          {/* Degree */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-blue-500/3 border border-indigo-500/14 space-y-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-400"/>
              <span className="text-sm font-semibold text-indigo-300">Degree / B.Tech <span className="text-xs text-white/25 font-normal">(Optional)</span></span>
            </div>
            <Field label="University / College">
              <Inp placeholder="e.g. Savitribai Phule Pune University"
                onChange={e=>handleChange(["education","degree","institution"],e.target.value)}/>
            </Field>
            <Field label="Degree">
              <Inp placeholder="e.g. B.Tech Computer Engineering"
                onChange={e=>handleChange(["education","degree","degree"],e.target.value)}/>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Graduation Year" error={fe("degree.year")}>
                <Inp placeholder="2026" hasErr={!!fe("degree.year")}
                  onChange={e=>handleChange(["education","degree","year"],e.target.value)}/>
              </Field>
              <Field label="GPA / CGPA" error={fe("degree.gpa")}>
                <Inp placeholder="8.50" hasErr={!!fe("degree.gpa")}
                  onChange={e=>handleChange(["education","degree","gpa"],e.target.value)}/>
              </Field>
            </div>
          </div>
        </div>
      );

      case "skills": return (
        <div className="space-y-5">
          <PanelHeader icon={Wrench} gradient="from-emerald-500 to-teal-500"
            title="Skills" subtitle="What tools and technologies do you use?" />
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/7 to-teal-500/4 border border-emerald-500/17 space-y-3">
            <Field label="Technical Skills" required error={ve("technical")?"At least one skill is required":undefined}>
              <TA placeholder="React, Node.js, Python, MySQL, Git, Tailwind CSS… (comma separated)"
                hasErr={!!ve("technical")} rows={3}
                value={form.skills.technical} onChange={e=>handleChange(["skills","technical"],e.target.value)}/>
            </Field>
            <TagRow text={form.skills.technical} color="bg-emerald-500/15 border-emerald-500/30 text-emerald-300"/>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-500/5 to-cyan-500/3 border border-teal-500/14 space-y-3">
            <Field label="Soft Skills">
              <TA placeholder="Communication, Teamwork, Problem Solving, Leadership… (comma separated)"
                rows={2} value={form.skills.soft} onChange={e=>handleChange(["skills","soft"],e.target.value)}/>
            </Field>
            <TagRow text={form.skills.soft} color="bg-teal-500/15 border-teal-500/30 text-teal-300"/>
          </div>
        </div>
      );

      case "experience": return (
        <div className="space-y-5">
          <PanelHeader icon={Briefcase} gradient="from-orange-500 to-amber-500"
            title="Experience" subtitle="Internships, part-time or full-time jobs (Optional)" />
          <button onClick={addExp}
            className="w-full py-3 rounded-xl border-2 border-dashed border-orange-500/25 text-orange-400/80 hover:border-orange-400/50 hover:text-orange-400 hover:bg-orange-500/5 transition-all flex items-center justify-center gap-2 text-sm font-medium">
            <Plus className="w-4 h-4"/> Add Experience
          </button>
          {form.experience.length===0 && (
            <div className="py-10 text-center space-y-2">
              <Briefcase className="w-10 h-10 mx-auto text-white/10"/>
              <p className="text-sm text-white/25">No experience entries yet.</p>
              <p className="text-xs text-white/18">You can skip this and still get a great resume!</p>
            </div>
          )}
          <div className="space-y-4">
            {form.experience.map((exp,i)=>(
              <motion.div key={i} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
                className="p-5 rounded-2xl bg-gradient-to-br from-orange-500/7 to-amber-500/4 border border-orange-500/18 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-orange-500/25 border border-orange-500/35 flex items-center justify-center text-[11px] font-bold text-orange-300">{i+1}</div>
                    <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Experience</span>
                  </div>
                  <button onClick={()=>remExp(i)}
                    className="p-1.5 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 className="w-3.5 h-3.5"/>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Job Title"><Inp placeholder="e.g. Frontend Intern" value={exp.role} onChange={e=>updExp(i,"role",e.target.value)}/></Field>
                  <Field label="Company"><Inp placeholder="e.g. Infosys" value={exp.company} onChange={e=>updExp(i,"company",e.target.value)}/></Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Location"><Inp placeholder="e.g. Pune" value={exp.location} onChange={e=>updExp(i,"location",e.target.value)}/></Field>
                  <Field label="Duration"><Inp placeholder="Jan 2024 – Jun 2024" value={exp.duration} onChange={e=>updExp(i,"duration",e.target.value)}/></Field>
                </div>
                <Field label="What did you do? (one bullet per line)">
                  <TA placeholder={"Built REST API endpoints for user management\nReduced page load time by 40% using lazy loading\nCollaborated with a 5-member Agile team"} rows={4}
                    value={exp.bullets} onChange={e=>updExp(i,"bullets",e.target.value)}/>
                </Field>
              </motion.div>
            ))}
          </div>
        </div>
      );

      case "projects": return (
        <div className="space-y-5">
          <PanelHeader icon={FolderGit2} gradient="from-pink-500 to-rose-500"
            title="Projects" subtitle="Showcase what you've built — hackathons, personal, college" />
          <button onClick={addProj}
            className="w-full py-3 rounded-xl border-2 border-dashed border-pink-500/25 text-pink-400/80 hover:border-pink-400/50 hover:text-pink-400 hover:bg-pink-500/5 transition-all flex items-center justify-center gap-2 text-sm font-medium">
            <Plus className="w-4 h-4"/> Add Project
          </button>
          {form.projects.length===0 && (
            <div className="py-10 text-center space-y-2">
              <FolderGit2 className="w-10 h-10 mx-auto text-white/10"/>
              <p className="text-sm text-white/25">No projects yet. Add at least one to stand out!</p>
            </div>
          )}
          <div className="space-y-4">
            {form.projects.map((proj,i)=>(
              <motion.div key={i} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
                className="p-5 rounded-2xl bg-gradient-to-br from-pink-500/7 to-rose-500/4 border border-pink-500/18 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-pink-500/25 border border-pink-500/35 flex items-center justify-center text-[11px] font-bold text-pink-300">{i+1}</div>
                    <span className="text-xs font-bold text-pink-400 uppercase tracking-widest">Project</span>
                  </div>
                  <button onClick={()=>remProj(i)}
                    className="p-1.5 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 className="w-3.5 h-3.5"/>
                  </button>
                </div>
                <Field label="Project Title">
                  <Inp placeholder="e.g. AgriConnect" value={proj.title} onChange={e=>updProj(i,"title",e.target.value)}/>
                </Field>
                <Field label="Technologies Used (comma separated)">
                  <Inp placeholder="React, Node.js, MongoDB, Tailwind CSS"
                    value={proj.technologies} onChange={e=>updProj(i,"technologies",e.target.value)}/>
                </Field>
                <TagRow text={proj.technologies} color="bg-pink-500/15 border-pink-500/28 text-pink-300"/>
                <Field label="What did you build? (one bullet per line)">
                  <TA placeholder={"Designed a responsive web app for elderly users with speech assist\nIntegrated multilingual support for 5 regional languages\nAchieved 95+ Lighthouse accessibility score"} rows={4}
                    value={proj.description} onChange={e=>updProj(i,"description",e.target.value)}/>
                </Field>
              </motion.div>
            ))}
          </div>
        </div>
      );

      case "extras": return (
        <div className="space-y-5">
          <PanelHeader icon={Award} gradient="from-yellow-500 to-orange-500"
            title="Extras" subtitle="Certifications, awards, achievements" />
          <div className="p-5 rounded-2xl bg-gradient-to-br from-yellow-500/7 to-orange-500/4 border border-yellow-500/17 space-y-4">
            <Field label="One per line">
              <TA placeholder={"AWS Cloud Practitioner\nGoogle UX Design Certificate\nSIH 2024 — 2nd Place Nationally\nIEEE Techsangam 2025 — Top 10 Finalist"}
                rows={8} value={form.certifications}
                onChange={e=>handleChange(["certifications"],e.target.value)}/>
            </Field>
          </div>
          {form.certifications.trim() && (
            <div className="space-y-2">
              {form.certifications.split("\n").map(c=>c.trim()).filter(Boolean).map((c,i)=>(
                <motion.div key={i} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-yellow-500/8 border border-yellow-500/18">
                  <Award className="w-3.5 h-3.5 text-yellow-400 shrink-0"/>
                  <span className="text-xs text-yellow-200/90">{c}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      );

      case "jd": return (
        <div className="space-y-5">
          <PanelHeader icon={Target} gradient="from-indigo-500 to-violet-500"
            title="Job Match" subtitle="Paste a job description to tailor your resume" />
          <Field label="Job Description (Optional)">
            <TA placeholder={"Paste the full job description here...\n\nWe are looking for a React Developer with:\n• Strong proficiency in JavaScript & TypeScript\n• Experience with REST APIs\n• Good communication skills"}
              rows={10} value={jobDescription} onChange={e=>setJobDescription(e.target.value)}/>
          </Field>
          <div className="p-4 rounded-xl bg-indigo-500/8 border border-indigo-500/20 flex items-start gap-3">
            <Zap className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5"/>
            <p className="text-xs text-indigo-300/90 leading-relaxed">
              Adding a job description lets our AI match your skills and experience to what recruiters actually want — improving your ATS score significantly.
            </p>
          </div>

          {/* Summary picker */}
          <AnimatePresence>
            {summaryOptions.length>0 && (
              <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                className="space-y-3 pt-2">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkle className="w-4 h-4 text-violet-400"/>
                  <h3 className="text-sm font-bold text-white">Pick Your Summary</h3>
                  <span className="text-xs text-white/30">— choose the one that fits you best</span>
                </div>
                <div className="space-y-2">
                  {summaryOptions.map((opt,i)=>(
                    <motion.button key={i} onClick={()=>setSelectedSummary(opt)}
                      whileHover={{scale:1.005}} whileTap={{scale:0.997}}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                        selectedSummary===opt
                          ? "border-violet-500/55 bg-violet-500/10 shadow-lg shadow-violet-500/8"
                          : "border-white/8 bg-white/[0.02] hover:border-violet-500/28 hover:bg-white/[0.04]"
                      }`}>
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                          selectedSummary===opt?"border-violet-500 bg-violet-500":"border-white/20"
                        }`}>
                          {selectedSummary===opt && <Check className="w-3 h-3 text-white"/>}
                        </div>
                        <p className="text-sm text-white/75 leading-relaxed">{opt}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
                <AnimatePresence>
                  {selectedSummary && (
                    <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                      className="flex items-center gap-2 p-3 rounded-xl bg-green-500/[0.08] border border-green-500/20">
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0"/>
                      <p className="text-xs text-green-300">Great choice! Now click <span className="font-bold">Build My Resume</span> below.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA */}
          <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.98}}
            onClick={handleGenerate} disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 font-bold text-white shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base">
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin"/>{selectedSummary?"Building your resume…":"Generating summaries…"}</>
            ) : selectedSummary ? (
              <><Zap className="w-5 h-5"/>Build My Resume<ArrowRight className="w-4 h-4 ml-1"/></>
            ) : (
              <><Sparkle className="w-5 h-5"/>{summaryOptions.length?"Re-generate Summaries":"Generate Summaries"}</>
            )}
          </motion.button>
        </div>
      );

      default: return null;
    }
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#07090f] text-white">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] rounded-full bg-violet-600/6 blur-[120px]"/>
        <div className="absolute top-2/3 -right-32 w-96 h-96 rounded-full bg-cyan-500/5 blur-[100px]"/>
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-indigo-500/5 blur-[100px]"/>
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-10">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-10">
          <motion.button initial={{opacity:0,x:-12}} animate={{opacity:1,x:0}}
            onClick={()=>navigate("/dashboard")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white/75 hover:text-white hover:bg-white/10 transition-all group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"/>
            Back to Dashboard
          </motion.button>
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} transition={{delay:0.1}}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/8">
            <GraduationCap className="w-3.5 h-3.5 text-cyan-400"/>
            <span className="text-xs font-semibold text-white/60">Fresher Resume Wizard</span>
          </motion.div>
          {!user ? (
            <button onClick={openLogin}
              className="text-xs text-amber-400 px-3 py-1.5 rounded-lg border border-amber-500/25 bg-amber-500/8 hover:bg-amber-500/15 transition-all">
              Login
            </button>
          ) : <div className="w-16"/>}
        </div>

        {/* ── Horizontal stepper ── */}
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.15}}
          className="mb-8">
          {/* Track */}
          <div className="relative flex items-center justify-between mb-3">
            {/* Background rail */}
            <div className="absolute top-4 left-4 right-4 h-px bg-white/6"/>
            {/* Filled rail */}
            <motion.div
              className="absolute top-4 left-4 h-px bg-gradient-to-r from-violet-500 to-cyan-500 origin-left"
              style={{right:"auto"}}
              animate={{width:`calc(${(step/(STEPS.length-1))*100}% - 2rem)`}}
              transition={{duration:0.4,ease:"easeInOut"}}/>
            {/* Step dots */}
            {STEPS.map((s,i)=>{
              const Icon = s.icon;
              const done = completedSteps.has(i) && i!==step;
              const active = step===i;
              return (
                <button key={s.id} onClick={()=>{ if(i<=step) goTo(i); }}
                  className="flex flex-col items-center gap-1 z-10 group">
                  <motion.div
                    whileHover={{scale:1.12}} whileTap={{scale:0.92}}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                      active
                        ? `bg-gradient-to-br ${s.color} border-transparent shadow-md`
                        : done
                          ? "bg-green-500/15 border-green-500/40"
                          : "bg-white/[0.04] border-white/10 hover:border-white/22 hover:bg-white/[0.07]"
                    }`}>
                    {done
                      ? <Check className="w-3.5 h-3.5 text-green-400"/>
                      : <Icon className={`w-3.5 h-3.5 transition-colors ${active?"text-white":"text-white/28 group-hover:text-white/55"}`}/>
                    }
                  </motion.div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider transition-colors hidden sm:block ${
                    active?"text-white/80":done?"text-green-500/60":"text-white/20 group-hover:text-white/45"
                  }`}>{s.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ── Panel card ── */}
        <div className="relative min-h-[500px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div key={stepId}
              custom={direction}
              initial={{opacity:0,x:direction*36}}
              animate={{opacity:1,x:0}}
              exit={{opacity:0,x:direction*-36}}
              transition={{duration:0.25,ease:"easeInOut"}}
              className="p-7 rounded-3xl border border-white/[0.07] backdrop-blur-xl"
              style={{background:"rgba(255,255,255,0.022)"}}>

              {/* Validation banner */}
              <AnimatePresence>
                {showErrors && Object.keys(validationErrors).length>0 && (
                  <motion.div initial={{opacity:0,y:-8,height:0}} animate={{opacity:1,y:0,height:"auto"}} exit={{opacity:0,height:0}}
                    className="mb-5 p-3.5 rounded-xl bg-red-500/8 border border-red-500/22 flex items-start gap-2 overflow-hidden">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5"/>
                    <p className="text-xs text-red-300 leading-relaxed">Please fill in all required fields marked with <span className="text-red-400 font-bold">*</span> to continue.</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {renderPanel()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Navigation ── */}
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.3}}
          className="flex items-center justify-between mt-5">
          <button onClick={()=>goTo(step-1)} disabled={step===0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/8 bg-white/[0.03] text-white/40 hover:text-white/70 hover:border-white/18 hover:bg-white/[0.05] transition-all disabled:opacity-0 disabled:pointer-events-none text-sm font-medium">
            <ArrowLeft className="w-4 h-4"/> Back
          </button>

          {/* Dots progress */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((_,i)=>(
              <motion.div key={i}
                animate={{
                  width: i===step ? 24 : 6,
                  backgroundColor: i===step ? "#8b5cf6" : completedSteps.has(i) ? "#22c55e" : "rgba(255,255,255,0.15)"
                }}
                transition={{duration:0.3}}
                className="h-1.5 rounded-full cursor-pointer"
                onClick={()=>{ if(i<=step) goTo(i); }}
              />
            ))}
          </div>

          {step < STEPS.length-1 ? (
            <button onClick={()=>goTo(step+1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500/70 to-cyan-500/70 hover:from-violet-500 hover:to-cyan-500 text-white text-sm font-bold shadow-lg shadow-violet-500/15 hover:shadow-violet-500/28 transition-all">
              Next <ChevronRight className="w-4 h-4"/>
            </button>
          ) : <div className="w-24"/>}
        </motion.div>
      </div>
    </div>
  );
}