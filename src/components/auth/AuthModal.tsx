import React, { useState } from "react";
import { User, Mail, Lock, Sparkles, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { UserAccount } from "../../types";
import { signInWithGooglePopup } from "../../lib/firebase";

interface AuthModalProps {
  onSuccess: (user: UserAccount) => void;
  onClose?: () => void;
}

export function AuthModal({ onSuccess, onClose }: AuthModalProps) {
  const [isRegistering, setIsRegistering] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const getDeviceId = () => {
    let deviceId = localStorage.getItem("jee_device_uuid");
    if (!deviceId) {
      const cookieMatch = document.cookie.match(/(?:^|; )jee_device_uuid=([^;]*)/);
      if (cookieMatch) {
        deviceId = cookieMatch[1];
      } else {
        deviceId = "dev_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
      }
      localStorage.setItem("jee_device_uuid", deviceId);
    }
    document.cookie = `jee_device_uuid=${deviceId}; max-age=31536000; path=/; SameSite=Lax`;
    return deviceId;
  };

  const hashPassword = (raw: string): string => {
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    return "hash_" + String(hash);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email || !password) {
      setErrorMessage("Please complete all email and password fields.");
      return;
    }

    if (isRegistering && password.length < 8) {
      setErrorMessage("Password must contain at least 8 characters.");
      return;
    }

    setSubmitting(true);
    const deviceId = getDeviceId();
    const payload = {
      name: name || "Student",
      email: email.trim().toLowerCase(),
      passwordHash: hashPassword(password),
      deviceId
    };

    const endpoint = isRegistering ? "/api/auth/register" : "/api/auth/login";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication operation failed.");
      }

      const successMsg = isRegistering
        ? (data.user?.credits > 0
            ? `Registration successful! ${data.user.credits} welcome credits added!`
            : "Registration successful!")
        : "Logged in successfully!";

      setSuccessMessage(successMsg);
      localStorage.setItem("jee_user_account", JSON.stringify(data.user));

      setTimeout(() => {
        onSuccess(data.user);
        if (onClose) onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setLoadingGoogle(true);

    try {
      const deviceId = getDeviceId();
      const gUser = await signInWithGooglePopup();
      if (!gUser || !gUser.email) {
        throw new Error("Could not retrieve email from Google Sign-In.");
      }

      const payload = {
        email: gUser.email,
        name: gUser.displayName || "Student",
        deviceId
      };

      const res = await fetch("/api/auth/google-signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Google Authentication processing failed.");
      }

      setSuccessMessage(`Welcome, ${data.user.name || "Student"}!`);
      localStorage.setItem("jee_user_account", JSON.stringify(data.user));

      setTimeout(() => {
        onSuccess(data.user);
        if (onClose) onClose();
      }, 700);
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user" && err?.code !== "auth/cancelled-popup-request") {
        setErrorMessage(err.message || "Google Sign-In failed.");
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="max-w-md mx-auto" id="auth_view_box">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900">
          {isRegistering ? "Sign Up & Get 3 Free Mock Parses" : "Sign In to Candidate Desk"}
        </h3>
        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
          {isRegistering
            ? "Create an account to test paper parsing and simulate live CBT mock tests."
            : "Access your saved mock tests, analytics, and available credits."}
        </p>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3.5 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-start gap-2.5 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 flex items-start gap-2.5 text-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleAuthSubmit} className="space-y-3.5">
        {isRegistering && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Candidate Name</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aryan Mehta"
                className="w-full bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-2 pl-9 pr-4 text-xs outline-none transition"
              />
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-700">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="candidate@gmail.com"
              className="w-full bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-2 pl-9 pr-4 text-xs outline-none transition"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-700">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full bg-white border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-2 pl-9 pr-12 text-xs outline-none transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600 font-semibold"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-2 bg-[#1a3a5f] hover:bg-[#132a45] disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5 text-blue-200" />
          {submitting
            ? "Processing..."
            : isRegistering
            ? "Sign Up & Get 3 Free Credits"
            : "Sign In"}
        </button>
      </form>

      <div className="relative my-4 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <span className="relative bg-white px-3 text-[11px] text-gray-400 select-none">or continue with</span>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loadingGoogle}
        className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2.5 shadow-xs cursor-pointer"
      >
        {loadingGoogle ? (
          <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
        ) : (
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
        )}
        {loadingGoogle ? "Connecting..." : "Sign in with Google"}
      </button>

      <div className="mt-4 text-center text-xs text-gray-500">
        {isRegistering ? "Already have an account? " : "New candidate? "}
        <button
          type="button"
          onClick={() => setIsRegistering(!isRegistering)}
          className="text-blue-600 hover:text-blue-700 font-bold underline cursor-pointer"
        >
          {isRegistering ? "Sign In" : "Sign Up"}
        </button>
      </div>
    </div>
  );
}
