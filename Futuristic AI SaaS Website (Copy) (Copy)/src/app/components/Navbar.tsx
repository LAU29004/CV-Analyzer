import { useState } from "react";
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
import { useAuthModal } from "../context/AuthModalContext";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { Link, useLocation, useNavigate } from "react-router-dom";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const { openLogin, openSignup } = useAuthModal();
  const { user, userData, isAdmin } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  const toTitleCase = (value: string) =>
    value
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");

  const resolveDisplayName = () => {
    const profileName =
      userData?.displayName?.trim() ||
      userData?.name?.trim() ||
      user?.displayName?.trim();
    if (profileName) return profileName;

    const emailLocalPart = user?.email?.split("@")[0]?.trim();
    if (emailLocalPart) {
      const cleaned = emailLocalPart.replace(/[._-]+/g, " ").replace(/\s+/g, " ").trim();
      return cleaned ? toTitleCase(cleaned) : "User";
    }

    return "User";
  };

  const displayUserName = resolveDisplayName();

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────
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
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  // ─────────────────────────────────────────────
  // Nav links config
  // ─────────────────────────────────────────────
  const navLinks: { label: string; id?: string; path?: string }[] = [
    //{ label: "Dashboard", id: "dashboard" },
    { label: "Career Roadmap", path: "/roadmap" },
    { label: "Interview Q&A", path: "/interview-qa" },
    { label: "Job Suggestions", path: "/job-suggestions" },
    // { label: "Features", id: "features" },
    // { label: "Solutions", id: "solutions" },
  ];

  const handleNavClick = ({ id, path }: { id?: string; path?: string }) => {
    setIsMenuOpen(false);
    if (path) {
      navigate(path);
      return;
    }
    if (id) {
      scrollToSection(id);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 backdrop-blur-xl bg-background/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* ── Logo ── */}
          <button
            onClick={() => scrollToSection("hero")}
            className="flex items-center gap-3 p-3 rounded-2xl 
             cursor-pointer border bg-white
             hover:shadow-xl hover:scale-105 
             transition-all duration-300"
          >
            <Sparkles className="w-8 h-8 text-violet-400" />

            <span className="text-xl font-semibold text-gray-800">
              CV Analyzer
            </span>
          </button>

          {/* ── Desktop nav ── */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/dashboard"
              className="px-4 py-2 rounded-full border border-amber-500/50 hover:bg-amber-500/10 transition-colors flex items-center gap-2 text-sm text-amber-400"
            >
              <Shield className="w-4 h-4" />
              Dashboard
            </Link>
            {navLinks.map(({ label, id, path }) => (
              <button
                key={id ?? path ?? label}
                onClick={() => handleNavClick({ id, path })}
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
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                {/* User badge */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/30">
                  <UserIcon className="w-4 h-4 text-violet-400" />
                  <span className="text-sm text-violet-400 max-w-[140px] truncate">
                    {displayUserName}
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
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile dropdown ── */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-white/10 backdrop-blur-xl bg-background/95">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map(({ label, id, path }) => (
              <button
                key={id ?? path ?? label}
                onClick={() => handleNavClick({ id, path })}
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
                    {displayUserName}
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
                  onClick={() => {
                    openLogin();
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-6 py-2 rounded-full border border-violet-500/50 hover:bg-violet-500/10 transition-all text-sm"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    openSignup();
                    setIsMenuOpen(false);
                  }}
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
