import { useState } from 'react';
import { Menu, X, Moon, Sun, Sparkles, Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'phone'
  const [showOTP, setShowOTP] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const switchToSignup = () => {
    setShowLogin(false);
    setShowSignup(true);
  };

  const switchToLogin = () => {
    setShowSignup(false);
    setShowLogin(true);
  };

  return (
    <>
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
              <a href="#dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </a>
              <a href="#roadmap" className="text-muted-foreground hover:text-foreground transition-colors">
                Career Roadmap
              </a>
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#solutions" className="text-muted-foreground hover:text-foreground transition-colors">
                Solutions
              </a>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => setShowLogin(true)}
                className="px-6 py-2 rounded-full border border-violet-500/50 hover:bg-violet-500/10 transition-all"
              >
                Login
              </button>
              <button 
                onClick={() => setShowSignup(true)}
                className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-500 hover:shadow-lg hover:shadow-violet-500/50 transition-all"
              >
                Sign Up
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
              <a href="#dashboard" className="block py-2 text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </a>
              <a href="#roadmap" className="block py-2 text-muted-foreground hover:text-foreground transition-colors">
                Career Roadmap
              </a>
              <a href="#features" className="block py-2 text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#solutions" className="block py-2 text-muted-foreground hover:text-foreground transition-colors">
                Solutions
              </a>
              <button 
                onClick={() => {
                  setShowLogin(true);
                  setIsMenuOpen(false);
                }}
                className="w-full px-6 py-2 rounded-full border border-violet-500/50 hover:bg-violet-500/10 transition-all"
              >
                Login
              </button>
              <button 
                onClick={() => {
                  setShowSignup(true);
                  setIsMenuOpen(false);
                }}
                className="w-full px-6 py-2 rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-500 hover:shadow-lg hover:shadow-violet-500/50 transition-all"
              >
                Sign Up
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-background border border-white/10 rounded-2xl p-8 shadow-2xl">
            <button
              onClick={() => {
                setShowLogin(false);
                setLoginMethod('email');
                setShowOTP(false);
              }}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 mb-2">
                <Sparkles className="w-6 h-6 text-violet-400" />
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  Welcome Back
                </h2>
              </div>
              <p className="text-muted-foreground text-sm">Login to continue your journey</p>
            </div>

            {!showOTP ? (
              <div className="space-y-4">
                {/* Login Method Tabs */}
                <div className="flex gap-2 p-1 bg-accent/50 rounded-lg">
                  <button
                    onClick={() => setLoginMethod('email')}
                    className={`flex-1 py-2 px-4 rounded-md transition-all ${
                      loginMethod === 'email'
                        ? 'bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-500 text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Email
                  </button>
                  <button
                    onClick={() => setLoginMethod('phone')}
                    className={`flex-1 py-2 px-4 rounded-md transition-all ${
                      loginMethod === 'phone'
                        ? 'bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-500 text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Phone
                  </button>
                </div>

                {loginMethod === 'email' ? (
                  <>
                    {/* Email Input */}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="email"
                          placeholder="your.email@example.com"
                          className="w-full pl-10 pr-4 py-3 bg-accent/50 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-12 py-3 bg-accent/50 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                        />
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Forgot Password */}
                    <div className="text-right">
                      <button className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
                        Forgot Password?
                      </button>
                    </div>

                    {/* Login Button */}
                    <button className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-500 hover:shadow-lg hover:shadow-violet-500/50 transition-all font-medium">
                      Login
                    </button>
                  </>
                ) : (
                  <>
                    {/* Phone Input */}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          className="w-full pl-10 pr-4 py-3 bg-accent/50 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* Send OTP Button */}
                    <button 
                      onClick={() => setShowOTP(true)}
                      className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-500 hover:shadow-lg hover:shadow-violet-500/50 transition-all font-medium"
                    >
                      Send OTP
                    </button>
                  </>
                )}

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-background text-muted-foreground">or continue with</span>
                  </div>
                </div>

                {/* Google Login */}
                <button className="w-full py-3 px-4 rounded-lg border border-white/10 hover:bg-accent/50 transition-all flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </button>

                {/* Sign Up Link */}
                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <button onClick={switchToSignup} className="text-violet-400 hover:text-violet-300 transition-colors">
                    Sign up
                  </button>
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* OTP Input */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Enter OTP</label>
                  <input
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-3 bg-accent/50 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all text-center text-2xl tracking-widest"
                  />
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  Didn't receive code?{' '}
                  <button className="text-violet-400 hover:text-violet-300 transition-colors">
                    Resend
                  </button>
                </p>

                {/* Verify Button */}
                <button className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-500 hover:shadow-lg hover:shadow-violet-500/50 transition-all font-medium">
                  Verify & Login
                </button>

                {/* Back Button */}
                <button 
                  onClick={() => setShowOTP(false)}
                  className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Back to phone number
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sign Up Modal */}
      {showSignup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-background border border-white/10 rounded-2xl p-8 shadow-2xl">
            <button
              onClick={() => setShowSignup(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 mb-2">
                <Sparkles className="w-6 h-6 text-violet-400" />
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  Create Account
                </h2>
              </div>
              <p className="text-muted-foreground text-sm">Start your career journey today</p>
            </div>

            <div className="space-y-4">
              {/* Full Name Input */}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-3 bg-accent/50 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="your.email@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-accent/50 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 bg-accent/50 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 bg-accent/50 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  />
                  <button
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Sign Up Button */}
              <button className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-500 hover:shadow-lg hover:shadow-violet-500/50 transition-all font-medium">
                Sign Up
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background text-muted-foreground">or continue with</span>
                </div>
              </div>

              {/* Google Sign Up */}
              <button className="w-full py-3 px-4 rounded-lg border border-white/10 hover:bg-accent/50 transition-all flex items-center justify-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>

              {/* Login Link */}
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <button onClick={switchToLogin} className="text-violet-400 hover:text-violet-300 transition-colors">
                  Login
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}