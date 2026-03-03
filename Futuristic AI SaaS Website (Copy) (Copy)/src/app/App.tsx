import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Moon,
  Sun,
  Sparkles,
  LogOut,
  User as UserIcon,
  Shield,
} from "lucide-react";

import { Hero } from "./components/Hero";
import { Problems } from "./components/Problems";
import { Solutions } from "./components/Solutions";
import { Features } from "./components/Features";
import { Roadmap } from "./components/Roadmap";
import { Dashboard } from "./components/Dashboard";
import { Stats } from "./components/Stats";
import { CTA } from "./components/CTA";
import { Footer } from "./components/Footer";
import { RoadmapGenerator } from "./components/RoadmapGenerator";
import { InterviewQA } from "./components/InterviewQA";
import { FindJobs } from "./components/JobSuggestions";
import { AuthProvider } from "./context/AuthContext";
import { AuthModalProvider, useAuthModal } from "./context/AuthModalContext";
import { AuthModals } from "./components/Authmodals";
import AdminPage from "./components/AdminPage";
import AdminRoute from "./components/AdminRoute";
import { useAuth } from "./context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "./config/firebase";

function RoadmapGenerateRoute() {
  const navigate = useNavigate();
  return <RoadmapGenerator onBack={() => navigate('/')} />;
}

// ─────────────────────────────────────────────
// Navbar (merged inline from Navbar.tsx)
// ─────────────────────────────────────────────
function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const { openLogin, openSignup } = useAuthModal();
  const { user, userData, isAdmin } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  // ── Helpers ──
  const toggleTheme = () => {
    setIsDark((d) => !d);
    document.documentElement.classList.toggle("dark");
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsMenuOpen(false);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const scrollToSection = (id: string) => {
    setIsMenuOpen(false);
    if (location.pathname === "/") {
      const element = document.getElementById(id);
      if (element) element.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/");
      // wait a bit for the route to render the landing page DOM
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  };

  // ── Nav links config ──
  const navLinks: { label: string; id: string }[] = [
    { label: "Dashboard", id: "dashboard" },
    { label: "Career Roadmap", id: "roadmap" },
    { label: "Interview Q&A", id: "interview-qa" },
    { label: "Job Suggestions", id: "job-suggestions" },
    { label: "Features", id: "features" },
    { label: "Solutions", id: "solutions" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 backdrop-blur-xl bg-background/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* ── Logo ── */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Sparkles className="w-8 h-8 text-violet-400" />
              <div className="absolute inset-0 blur-lg bg-violet-400/50 -z-10" />
            </div>
            <span className="text-xl bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              CV Analyzer
            </span>
          </div>

          {/* ── Desktop nav ── */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(({ label, id }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {label}
              </button>
            ))}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                {/* User badge */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/30">
                  <UserIcon className="w-4 h-4 text-violet-400" />
                  <span className="text-sm text-violet-400 max-w-[140px] truncate">
                    {userData?.displayName || user.email}
                  </span>
                </div>

                {/* Admin link */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="px-4 py-2 rounded-full border border-amber-500/50 hover:bg-amber-500/10 transition-colors flex items-center gap-2 text-sm text-amber-400"
                  >
                    <Shield className="w-4 h-4" />
                    Admin
                  </Link>
                )}

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-full border border-red-500/50 hover:bg-red-500/10 transition-colors flex items-center gap-2 text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={openLogin}
                  className="px-6 py-2 rounded-full border border-violet-500/50 hover:bg-violet-500/10 transition-all text-sm"
                >
                  Login
                </button>
                <button
                  onClick={openSignup}
                  className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-500 hover:shadow-lg hover:shadow-violet-500/50 transition-all text-sm"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* ── Mobile header icons ── */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile dropdown ── */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-white/10 backdrop-blur-xl bg-background/95">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map(({ label, id }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className="block w-full text-left py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {label}
              </button>
            ))}

            {user ? (
              <>
                {/* User badge */}
                <div className="py-2 px-4 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-violet-400" />
                  <p className="text-sm text-violet-400 truncate">
                    {userData?.displayName || user.email}
                  </p>
                </div>

                {/* Admin link */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full px-6 py-2 rounded-full border border-amber-500/50 hover:bg-amber-500/10 flex items-center justify-center gap-2 text-sm text-amber-400"
                  >
                    <Shield className="w-4 h-4" />
                    Admin Panel
                  </Link>
                )}

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full px-6 py-2 rounded-full border border-red-500/50 hover:bg-red-500/10 flex items-center justify-center gap-2 text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { openLogin(); setIsMenuOpen(false); }}
                  className="w-full px-6 py-2 rounded-full border border-violet-500/50 hover:bg-violet-500/10 transition-all text-sm"
                >
                  Login
                </button>
                <button
                  onClick={() => { openSignup(); setIsMenuOpen(false); }}
                  className="w-full px-6 py-2 rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-500 hover:shadow-lg hover:shadow-violet-500/50 transition-all text-sm"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

// ─────────────────────────────────────────────
// App
// ─────────────────────────────────────────────
export default function App() {

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <AuthProvider>
      <AuthModalProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            <Navbar />
            <AuthModals />

            <Routes>
              {/* 🔹 Landing Page */}
              <Route
                path="/"
                element={
                  <>
                    <Hero />
                    <Dashboard />
                    <Problems />
                    <Solutions />
                    <Features />
                      <InterviewQA />
                      <FindJobs />
                    <Roadmap />
                    <Stats />
                    <CTA />
                  </>
                }
              />

              {/* 🔹 Admin Page (Protected) */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminPage />
                  </AdminRoute>
                }
              />
              {/* 🔹 Roadmap generator route (direct page) */}
              <Route path="/roadmap/generate" element={<RoadmapGenerateRoute />} />
            </Routes>


            <Footer />
          </div>
        </BrowserRouter>
      </AuthModalProvider>
    </AuthProvider>
  );
}