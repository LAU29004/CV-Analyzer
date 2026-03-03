import { useState, useEffect, useRef } from "react";
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
  signInWithPhoneNumber,
  RecaptchaVerifier,
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

  // Phone verification states
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [phoneVerificationError, setPhoneVerificationError] = useState("");
  const [phoneVerificationSuccess, setPhoneVerificationSuccess] = useState(false);
  const [emailVerificationConfirmed, setEmailVerificationConfirmed] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  
  // Use ref for reCAPTCHA verifier to avoid re-initialization on re-renders
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Initialize reCAPTCHA verifier when phone verification section is shown
  useEffect(() => {
    if (showPhoneVerification && !recaptchaVerifierRef.current) {
      try {
        const element = document.getElementById("recaptcha-container");
        if (element && element.childNodes.length === 0) {
          // Only create if not already rendered
          const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
            size: "invisible",
            callback: (token: string) => {
              console.log("reCAPTCHA verified:", token);
            },
            "expired-callback": () => {
              console.log("reCAPTCHA expired");
              recaptchaVerifierRef.current = null;
            },
          });
          recaptchaVerifierRef.current = verifier;
          console.log("✅ reCAPTCHA verifier initialized");
        }
      } catch (error) {
        console.error("Failed to initialize reCAPTCHA:", error);
      }
    }

    // Cleanup on unmount or when phone verification is closed
    return () => {
      if (!showPhoneVerification && recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
          const element = document.getElementById("recaptcha-container");
          if (element) {
            element.innerHTML = ""; // Clear rendered reCAPTCHA but keep div
          }
          recaptchaVerifierRef.current = null;
          console.log("✅ reCAPTCHA verifier cleared");
        } catch (error) {
          console.error("Error clearing reCAPTCHA:", error);
        }
      }
    };
  }, [showPhoneVerification]);

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
    setShowPhoneVerification(false);
    setOtpSent(false);
    setOtp("");
    setPhoneVerificationError("");
    setPhoneVerificationSuccess(false);
    setEmailVerificationConfirmed(false);
    setConfirmationResult(null);
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
        const element = document.getElementById("recaptcha-container");
        if (element) element.innerHTML = "";
      } catch (error) {
        console.error("Error clearing reCAPTCHA during reset:", error);
      }
      recaptchaVerifierRef.current = null;
    }
    setLoading(false);
  };

  const handleClose = () => {
    // Determine if we need to sign out (if on success screen or unverified)
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

  // Phone number validation and formatting
  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, "");

    // If it starts with 91 and not +91, add +
    if (cleaned.startsWith("91") && !cleaned.startsWith("+91")) {
      return "+" + cleaned;
    }

    // If it doesn't have a country code, assume India (+91)
    if (!cleaned.startsWith("+") && cleaned.length === 10) {
      return "+91" + cleaned;
    }

    return cleaned;
  };

  const isValidPhoneNumber = (phone: string): boolean => {
    const formatted = formatPhoneNumber(phone);
    // E.164 format: +[1-9]{1}[0-9]{1,14}
    return /^\+?1?\d{9,15}$/.test(formatted.replace(/\s+/g, ""));
  };

  // ─────────────────────────────────────────────
  // GOOGLE AUTH
  // ─────────────────────────────────────────────
  const handleGoogleAuth = async () => {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      // This will trigger onAuthStateChanged -> syncWithBackend
      await signInWithPopup(auth, provider);
      resetForm();
      closeAuth();
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      // Handle cleanup if popup was closed/etc
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
      
      // Force reload to get latest verification status
      await user.reload();

      if (!user.emailVerified) {
        // 🔒 Critical: Unverified users are NOT allowed to log in.
        await signOut(auth);
        setError("Your email is not verified. Please check your inbox.");
        setShowResend(true);
        return; // Stays on login screen
      }

      // Valid login - AuthContext will handle the rest (sync)
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
       // We must sign in to send verification if not already signed in...
       const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password 
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
  // SIGNUP
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
      // 1. Create User
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        emailToRegister,
        password,
      );
      const user = userCredential.user;

      // 2. Update Profile (Firebase)
      await updateProfile(user, { displayName: fullName.trim() });
      
      // 3. Send Verification
      await sendEmailVerification(user);

      // Note: We do NOT create the user in MongoDB here manually.
      // The `syncWithBackend` in AuthContext will NOT run for unverified users (per our logic logic).
      // That's fine. The user will be created in MongoDB upon their first VALID login (after verification).
      // OR, does the backend require the user to exist to verify? No, Firebase handles verification.
      // Backend creation only happens when they legally log in.

      // 4. Show Success
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

  // ─────────────────────────────────────────────
  // SEND OTP FOR PHONE VERIFICATION
  // ─────────────────────────────────────────────
  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      setPhoneVerificationError("Please enter a phone number.");
      return;
    }

    // Validate and format phone number
    if (!isValidPhoneNumber(phoneNumber)) {
      setPhoneVerificationError(
        "Invalid phone number. Use format: +91 9876543210 (India) or international format with country code"
      );
      return;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber.trim());

    setLoading(true);
    setPhoneVerificationError("");

    try {
      if (!recaptchaVerifierRef.current) {
        setPhoneVerificationError("reCAPTCHA not ready. Please wait a moment and try again.");
        setLoading(false);
        return;
      }

      // Sign in with phone number - Firebase sends OTP automatically
      const result = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        recaptchaVerifierRef.current
      );

      setConfirmationResult(result);
      setOtpSent(true);
      setPhoneVerificationError("");
      
      console.log("✅ OTP sent to:", formattedPhone);
    } catch (err: any) {
      console.error("Send OTP error:", err);
      
      // Handle reCAPTCHA errors - clear the verifier so it can be recreated
      if (err.message && err.message.includes("reCAPTCHA")) {
        try {
          if (recaptchaVerifierRef.current) {
            recaptchaVerifierRef.current.clear();
          }
          const element = document.getElementById("recaptcha-container");
          if (element) element.innerHTML = "";
          recaptchaVerifierRef.current = null;
        } catch (clearError) {
          console.error("Error clearing reCAPTCHA after error:", clearError);
        }
      }
      
      let errorMsg = err.message || "Failed to send OTP";
      
      // Handle specific Firebase errors
      if (err.code === "auth/invalid-phone-number") {
        errorMsg = "Invalid phone number format. Use E.164 format like +919876543210";
      } else if (err.code === "auth/operation-not-allowed") {
        errorMsg = "Phone sign-in is not enabled. Contact administrator.";
      } else if (err.code === "auth/too-many-requests") {
        errorMsg = "Too many attempts. Please try again later.";
      } else if (err.message && err.message.includes("reCAPTCHA")) {
        errorMsg = "Security verification failed. Please try again.";
      }
      
      setPhoneVerificationError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // VERIFY OTP FOR PHONE
  // ─────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      setPhoneVerificationError("Please enter the OTP.");
      return;
    }

    if (otp.trim().length !== 6 || isNaN(Number(otp))) {
      setPhoneVerificationError("OTP must be a 6-digit number.");
      return;
    }

    if (!confirmationResult) {
      setPhoneVerificationError("OTP session expired. Please request a new OTP.");
      return;
    }

    setLoading(true);
    setPhoneVerificationError("");

    try {
      // Confirm OTP with Firebase
      await confirmationResult.confirm(otp.trim());

      // Phone is now verified and linked to the current user
      console.log("✅ Phone number verified successfully");
      setPhoneVerificationSuccess(true);
      setPhoneVerificationError("");

      // Auto logout after successful phone verification
      setTimeout(() => {
        signOut(auth).catch((e) => console.warn("Sign out after verification failed", e));
        resetForm();
        openLogin();
      }, 2000);
    } catch (err: any) {
      console.error("Verify OTP error:", err);
      
      let errorMsg = err.message || "Failed to verify OTP";
      
      // Handle specific Firebase errors
      if (err.code === "auth/invalid-verification-code") {
        errorMsg = "Invalid OTP. Please check and try again.";
      } else if (err.code === "auth/code-expired") {
        errorMsg = "OTP has expired. Please request a new one.";
      }
      
      setPhoneVerificationError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ═════════════════════════════════════════════
  // RECAPTCHA CONTAINER (Always in DOM to prevent removal)
  // ═════════════════════════════════════════════
  if (!isOpen) return null;

  // ═════════════════════════════════════════════
  // LOGIN MODAL
  // ═════════════════════════════════════════════
  return (
    <>
      {/* Hidden reCAPTCHA container - must persist in DOM */}
      <div id="recaptcha-container" style={{ display: "none" }}></div>

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
              onChange={(e) => {
                setEmail(e.target.value);
                setResendSuccess(false);
              }}
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
            <>
              {phoneVerificationSuccess ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                    <Smartphone className="w-8 h-8 text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Phone Verified!</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your phone number has been verified successfully.
                  </p>
                  <p className="text-xs text-green-400 mb-6">
                    Redirecting to login...
                  </p>
                </div>
              ) : showPhoneVerification ? (
                <div className="text-center py-4">
                  <>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                      <Smartphone className="w-8 h-8 text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Verify Phone Number</h2>
                    <p className="text-sm text-muted-foreground mb-6">
                      We'll send an OTP to{" "}
                      <span className="text-violet-400 font-medium">
                        {phoneNumber}
                      </span>
                    </p>

                    {phoneVerificationError && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 mb-4">
                        <p className="text-sm text-red-400">{phoneVerificationError}</p>
                      </div>
                    )}

                    {otpSent && (
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 mb-4">
                        <p className="text-xs text-blue-400">
                          ℹ️ OTP sent via SMS. Check your phone.
                        </p>
                      </div>
                    )}

                    {!otpSent ? (
                      <button
                        onClick={handleSendOTP}
                        disabled={loading}
                        className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium mb-4"
                      >
                        {loading ? "Sending OTP..." : "Send OTP"}
                      </button>
                    ) : (
                      <>
                        <div className="space-y-4">
                          <input
                            type="text"
                            maxLength={6}
                            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-center text-2xl tracking-widest font-mono"
                            placeholder="000000"
                            value={otp}
                            onChange={(e) => {
                              if (e.target.value.length <= 6 && /^\d*$/.test(e.target.value)) {
                                setOtp(e.target.value);
                              }
                            }}
                            disabled={loading}
                          />
                          <button
                            onClick={handleVerifyOTP}
                            disabled={loading || otp.length !== 6}
                            className="w-full py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-lg hover:shadow-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                          >
                            {loading ? "Verifying..." : "Verify OTP"}
                          </button>
                        </div>

                        <button
                          onClick={() => {
                            setOtpSent(false);
                            setOtp("");
                            setPhoneVerificationError("");
                          }}
                          disabled={loading}
                          className="w-full mt-4 py-2 text-xs text-violet-400 hover:text-violet-300 underline disabled:opacity-50"
                        >
                          Change Phone Number
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => {
                        setShowPhoneVerification(false);
                        signOut(auth).catch((e) => console.warn("Sign out failed", e));
                        resetForm();
                        openLogin();
                      }}
                      disabled={loading}
                      className="w-full mt-4 py-2 text-xs text-muted-foreground hover:text-foreground underline disabled:opacity-50"
                    >
                      Skip and Go to Login
                    </button>
                  </>
                </div>
              ) : (
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

                  {phoneNumber.trim() && (
                    <>
                      <p className="text-sm text-muted-foreground mb-4">
                        After verifying your email, you can also verify your phone number.
                      </p>
                      <button
                        onClick={() => {
                          setEmailVerificationConfirmed(true);
                          setShowPhoneVerification(true);
                        }}
                        disabled={loading}
                        className="w-full py-3 rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 hover:shadow-lg hover:shadow-violet-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium mb-3"
                      >
                        Next: Verify Phone Number
                      </button>
                    </>
                  )}

                  <button
                    onClick={handleSwitchToLogin}
                    className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-lg hover:shadow-cyan-500/50 transition-all text-sm font-medium"
                  >
                    Go to Login
                  </button>
                </div>
              )}
            </>
          ) : (
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

                <div className="relative">
                  <Smartphone className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <input
                    type="tel"
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-violet-500/50 outline-none text-sm"
                    placeholder="Phone Number: +91 9876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground mt-1 ml-1">
                    Format: Country code + number (e.g., +91 for India)
                  </p>
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
