"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";

export default function LoginForm() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="mx-auto w-full max-w-sm">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-black/80 p-6 shadow-[0_0_80px_-20px_rgba(0,200,255,0.25)]">
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
              mode === "login" ? "bg-orange-600" : "bg-white/5 hover:bg-white/10"
            }`}
          >
            {t("auth.login")}
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
              mode === "signup" ? "bg-orange-600" : "bg-white/5 hover:bg-white/10"
            }`}
          >
            {t("auth.signup")}
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-white/70">{t("auth.email")}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-sm text-white/70">{t("auth.password")}</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? t("auth.processing") : mode === "login" ? t("auth.login.cta") : t("auth.signup.cta")}
          </button>
        </form>
        <div className="my-4 flex items-center gap-3 text-white/40">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs">{t("auth.or")}</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <button
          onClick={loginWithGoogle}
          className="w-full rounded-md border border-white/15 bg-white/5 px-4 py-2 hover:bg-white/10 flex items-center justify-center gap-2"
        >
          <i className="bi bi-google text-lg" aria-hidden="true"></i>
          {t("auth.continue.google")}
        </button>
      </div>
    </div>
  );
}
