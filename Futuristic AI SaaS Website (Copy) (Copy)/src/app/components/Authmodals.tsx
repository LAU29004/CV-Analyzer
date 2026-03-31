import { useState } from "react";
import { X, Eye, EyeOff, MailCheck, Smartphone } from "lucide-react";
import { useAuthModal } from "../context/AuthModalContext";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../config/firebase";

const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export function AuthModals() {
  const { isOpen, mode, closeAuth, openLogin, openSignup } = useAuthModal();

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResend, setShowResend] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
    setPhoneNumber("");
    setError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowResend(false);
    setResendSuccess(false);
    setSignupSuccess(false);
    setRegisteredEmail("");
    setLoading(false);
  };

  const handleClose = () => {
    if (signupSuccess || (auth.currentUser && !auth.currentUser.emailVerified)) {
      signOut(auth).catch((e) => console.warn("Sign out on close failed", e));
    }
    resetForm();
    closeAuth();
  };

  const handleSwitchToLogin = () => {
    if (signupSuccess || auth.currentUser) {
      signOut(auth).catch((e) => console.warn("Sign out on switch failed", e));
    }
    resetForm();
    openLogin();
  };

  const isValidEmail = (val: string): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  // ─────────────────────────────────────────────
  // GOOGLE AUTH
  // ─────────────────────────────────────────────
  const handleGoogleAuth = async () => {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      resetForm();
      closeAuth();
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setError("Failed to sign in with Google. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowResend(false);
    setResendSuccess(false);

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password,
      );
      const user = userCredential.user;
      await user.reload();

      if (!user.emailVerified) {
        await signOut(auth);
        setError("Your email is not verified. Please check your inbox.");
        setShowResend(true);
        return;
      }

      resetForm();
      closeAuth();
    } catch (err: any) {
      console.error("Login Error:", err);
      switch (err.code) {
        case "auth/invalid-credential":
        case "auth/user-not-found":
        case "auth/wrong-password":
          setError("Invalid email or password.");
          break;
        case "auth/too-many-requests":
          setError("Too many failed attempts. Try again later.");
          break;
        case "auth/user-disabled":
          setError("This account has been disabled.");
          break;
        default:
          setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // RESEND VERIFICATION
  // ─────────────────────────────────────────────
  const handleResendVerification = async () => {
    if (!email) {
      setError("Please enter your email to resend verification.");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password,
      );
      await sendEmailVerification(userCredential.user);
      await signOut(auth);
      setShowResend(false);
      setResendSuccess(true);
      setError("");
    } catch (err: any) {
      console.error("Resend Error:", err);
      setError("Failed to resend. Ensure password is correct.");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // SIGNUP — saves phone directly to DB (no OTP)
  // ─────────────────────────────────────────────
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim() || !email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const emailToRegister = email.trim().toLowerCase();
    setRegisteredEmail(emailToRegister);

    try {
      // 1. Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        emailToRegister,
        password,
      );
      const user = userCredential.user;

      // 2. Update display name
      await updateProfile(user, { displayName: fullName.trim() });

      // 3. Send email verification
      await sendEmailVerification(user);

      // 4. Store phone in localStorage — AuthContext will pass it to /sync after
      //    the user verifies their email and logs in (DB user created then)
      if (phoneNumber.trim()) {
        localStorage.setItem(`pending_phone_${user.uid}`, phoneNumber.trim());
        console.log("📱 Phone number stored for sync:", phoneNumber.trim());
      }

      setLoading(false);
      setSignupSuccess(true);
    } catch (error: any) {
      console.error("Signup Error:", error);
      if (error.code === "auth/email-already-in-use") {
        setError("Email is already registered. Please login.");
      } else {
        setError("Failed to create account: " + error.message);
      }
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* ══════════ LOGIN MODAL ══════════ */}
      {mode === "login" && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-md bg-background p-8 rounded-2xl border border-white/10 shadow-2xl">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold text-center mb-2">Welcome Back</h2>
            <p className="text-center text-sm text-muted-foreground mb-6">
              Login to access all features
            </p>

            <button
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full mb-4 px-6 py-3 rounded-lg border border-white/10 hover:bg-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <GoogleLogo />
              <span className="text-sm font-medium">Continue with Google</span>
            </button>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {resendSuccess && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-start gap-2">
                  <MailCheck className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-green-400">
                    Verification email resent! Please check your inbox.
                  </p>
                </div>
              )}

              <input
                type="email"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setResendSuccess(false); }}
                required
                disabled={loading}
              />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 p-1 rounded hover:bg-white/5"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Eye className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </div>

              {showResend && !resendSuccess && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={loading}
                    className="text-xs text-violet-400 hover:text-violet-300 underline disabled:opacity-50"
                  >
                    {loading ? "Sending..." : "Resend Verification Email"}
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="text-center mt-6 text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button
                onClick={() => { resetForm(); openSignup(); }}
                className="text-violet-400 hover:text-violet-300 transition-colors"
                disabled={loading}
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      )}

      {/* ══════════ SIGNUP MODAL ══════════ */}
      {mode === "signup" && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-md bg-background p-8 rounded-2xl border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-accent transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>

            {signupSuccess ? (
              /* ── Email verification sent screen ── */
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                  <MailCheck className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Check Your Email</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  We sent a verification link to{" "}
                  <span className="text-violet-400 font-medium break-all">
                    {registeredEmail}
                  </span>
                  .<br /><br />
                  Click the link to verify your account.
                </p>
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-6 text-left">
                  <p className="text-xs text-amber-400">
                    💡 Don't see it? Check your <strong>spam / junk</strong> folder.
                    The link expires in 24 hours.
                  </p>
                </div>
                <button
                  onClick={handleSwitchToLogin}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-lg hover:shadow-cyan-500/50 transition-all text-sm font-medium"
                >
                  Go to Login
                </button>
              </div>
            ) : (
              /* ── Signup form ── */
              <>
                <h2 className="text-2xl font-bold text-center mb-2">Create Account</h2>
                <p className="text-center text-sm text-muted-foreground mb-6">
                  Join us to build amazing resumes
                </p>

                <button
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="w-full mb-4 px-6 py-3 rounded-lg border border-white/10 hover:bg-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  <GoogleLogo />
                  <span className="text-sm font-medium">Continue with Google</span>
                </button>

                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or register with email
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                    placeholder="Full Name *"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={loading}
                  />

                  <input
                    type="email"
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                    placeholder="Email *"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />

                  {/* Phone — optional, saved directly, no OTP */}
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <input
                      type="tel"
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                      placeholder="Phone Number (Optional)"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                      placeholder="Password * (min 6 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 p-1 rounded hover:bg-white/5"
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <Eye className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                      placeholder="Confirm Password *"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 p-1 rounded hover:bg-white/5"
                      disabled={loading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <Eye className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                  </div>

                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-400 -mt-1 ml-1">
                      Passwords do not match
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12" cy="12" r="10"
                            stroke="currentColor" strokeWidth="4" fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Creating account...
                      </span>
                    ) : (
                      "Sign Up"
                    )}
                  </button>
                </form>

                <p className="text-center mt-6 text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    onClick={handleSwitchToLogin}
                    className="text-violet-400 hover:text-violet-300 transition-colors"
                    disabled={loading}
                  >
                    Login
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
