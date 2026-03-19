import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MavLogo } from "./MavLogo";
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, ChevronLeft } from "lucide-react";

interface LoginPageProps {
  onLogin: () => void;
}

type AuthMode = "welcome" | "login" | "signup";

export function LoginPage({ onLogin }: LoginPageProps) {
  const [mode, setMode] = useState<AuthMode>("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    return email.toLowerCase().endsWith("@mavs.uta.edu") || email.toLowerCase().endsWith("@uta.edu");
  };

  const handleSubmit = () => {
    setError("");

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please use your UTA email (@mavs.uta.edu)");
      return;
    }

    if (!password.trim() || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (mode === "signup" && !name.trim()) {
      setError("Please enter your name");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 1200);
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <AnimatePresence mode="wait">
        {mode === "welcome" ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col h-full"
          >
            {/* Top section with logo */}
            <div className="flex-1 flex flex-col items-center justify-center px-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg">
                  <MavLogo size={80} />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="text-center mt-6"
              >
                <h1 className="text-2xl text-black tracking-tight">Mav Market</h1>
                <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                  Buy and sell with fellow Mavericks.<br />
                  Sign in with your UTA email.
                </p>
              </motion.div>
            </div>

            {/* Bottom buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="px-6 pb-12 space-y-3"
            >
              <button
                onClick={() => setMode("login")}
                className="w-full py-3.5 bg-black text-white rounded-xl text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                Log In
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => setMode("signup")}
                className="w-full py-3.5 bg-white text-black border border-gray-200 rounded-xl text-sm active:scale-[0.98] transition-transform"
              >
                Create Account
              </button>
              <p className="text-center text-[11px] text-gray-400 pt-2">
                Exclusive to UTA students with @mavs.uta.edu email
              </p>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div className="px-4 pt-4 pb-2">
              <button
                onClick={() => { setMode("welcome"); setError(""); }}
                className="p-1 -ml-1 text-black"
              >
                <ChevronLeft size={24} strokeWidth={1.5} />
              </button>
            </div>

            {/* Form content */}
            <div className="flex-1 px-6 pt-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-2xl text-black">
                  {mode === "login" ? "Welcome back" : "Create account"}
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  {mode === "login"
                    ? "Sign in with your UTA email"
                    : "Sign up with your UTA email to get started"
                  }
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-8 space-y-4"
              >
                {/* Name field (signup only) */}
                {mode === "signup" && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">Full Name</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Your full name"
                        value={name}
                        onChange={(e) => { setName(e.target.value); setError(""); }}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#0064B1] focus:bg-white transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* Email field */}
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">UTA Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      placeholder="yourname@mavs.uta.edu"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#0064B1] focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#0064B1] focus:bg-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-red-500 text-xs"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Forgot password (login only) */}
                {mode === "login" && (
                  <div className="text-right">
                    <button className="text-xs text-[#0064B1]">
                      Forgot password?
                    </button>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Submit button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="px-6 pb-12 pt-4"
            >
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3.5 bg-[#0064B1] text-white rounded-xl text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-70"
              >
                {loading ? (
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-white"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          delay: i * 0.15,
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <>
                    {mode === "login" ? "Log In" : "Create Account"}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-gray-400 mt-4">
                {mode === "login" ? (
                  <>
                    Don't have an account?{" "}
                    <button
                      onClick={() => { setMode("signup"); setError(""); }}
                      className="text-[#0064B1]"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      onClick={() => { setMode("login"); setError(""); }}
                      className="text-[#0064B1]"
                    >
                      Log in
                    </button>
                  </>
                )}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
