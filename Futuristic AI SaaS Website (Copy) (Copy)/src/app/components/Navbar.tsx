import { useState } from 'react';
import { Menu, X, Moon, Sun, Sparkles } from 'lucide-react';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 backdrop-blur-xl bg-background/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Sparkles className="w-8 h-8 text-violet-400" />
              <div className="absolute inset-0 blur-lg bg-violet-400/50 -z-10" />
            </div>
            <span className="text-xl bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              CV Analyzer
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#solutions" className="text-muted-foreground hover:text-foreground transition-colors">
              Solutions
            </a>
            <a href="#roadmap" className="text-muted-foreground hover:text-foreground transition-colors">
              Career Path
            </a>
            <a href="#dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </a>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-500 hover:shadow-lg hover:shadow-violet-500/50 transition-all">
              Get Started
            </button>
          </div>

          {/* Mobile menu button */}
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

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-white/10 backdrop-blur-xl bg-background/95">
          <div className="px-4 py-4 space-y-3">
            <a href="#features" className="block py-2 text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#solutions" className="block py-2 text-muted-foreground hover:text-foreground transition-colors">
              Solutions
            </a>
            <a href="#roadmap" className="block py-2 text-muted-foreground hover:text-foreground transition-colors">
              Career Path
            </a>
            <a href="#dashboard" className="block py-2 text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </a>
            <button className="w-full px-6 py-2 rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-500 hover:shadow-lg hover:shadow-violet-500/50 transition-all">
              Get Started
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
