"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import Image from "next/image";

export default function LoginForm() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/projects");
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
      router.replace("/projects");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : undefined;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: origin ? `${origin}/projects` : undefined },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "OAuth error";
      setError(message);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm sm:max-w-md">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-black/80 p-4 sm:p-6 shadow-[0_0_80px_-20px_rgba(0,200,255,0.25)]">
        {/* Logo Meowdrop */}
        <div className="mb-4 sm:mb-6 flex flex-col items-center">
          <Image
            src="/images/meowdrop.png"
            alt="Meow Drop Airdrop Tracker"
            width={100}
            height={100}
            className="h-auto w-auto sm:w-[120px] sm:h-auto"
            priority
          />
          <p className="mt-3 text-center text-xs sm:text-sm text-white/60 max-w-xs">
            Track and manage your crypto airdrop tasks
          </p>
        </div>
        <div className="mb-3 sm:mb-4 flex gap-2">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium ${
              mode === "login" ? "bg-orange-600" : "bg-white/5 hover:bg-white/10"
            }`}
          >
            {t("auth.login")}
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium ${
              mode === "signup" ? "bg-orange-600" : "bg-white/5 hover:bg-white/10"
            }`}
          >
            {t("auth.signup")}
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="text-xs sm:text-sm text-white/70">{t("auth.email")}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-2 sm:px-3 py-1.5 sm:py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-xs sm:text-sm text-white/70">{t("auth.password")}</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-black/40 px-2 sm:px-3 py-1.5 sm:py-2 pr-8 sm:pr-10 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 rounded p-0.5 sm:p-1 text-white/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"} aria-hidden="true"></i>
              </button>
            </div>
          </div>
          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-red-200">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-gradient-to-r from-amber-500 to-orange-600 px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? t("auth.processing") : mode === "login" ? t("auth.login.cta") : t("auth.signup.cta")}
          </button>
        </form>
        <div className="my-3 sm:my-4 flex items-center gap-2 sm:gap-3 text-white/40">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs sm:text-sm">{t("auth.or")}</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <button
          onClick={loginWithGoogle}
          className="w-full rounded-md border border-white/15 bg-white/5 px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-white/10 flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base"
        >
          <i className="bi bi-google text-lg" aria-hidden="true"></i>
          {t("auth.continue.google")}
        </button>
      </div>
    </div>
  );
}
