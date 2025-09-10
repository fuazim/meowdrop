"use client";

import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";

function ConfirmEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const token_hash = searchParams.get("token_hash");
        const type = searchParams.get("type");
        const next = searchParams.get("next") ?? "/projects";

        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as "signup" | "email_change" | "recovery",
          });

          if (error) {
            setStatus("error");
            setMessage(error.message);
          } else {
            setStatus("success");
            setMessage("Email confirmed successfully!");
            // Redirect to projects page after 2 seconds
            setTimeout(() => {
              router.push(next);
            }, 2000);
          }
        } else {
          setStatus("error");
          setMessage("Invalid confirmation link");
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    };

    if (searchParams) {
      confirmEmail();
    }
  }, [searchParams, router]);

  const getStatusIcon = () => {
    switch (status) {
      case "loading":
        return <i className="bi bi-hourglass-split text-4xl text-cyan-400 animate-spin"></i>;
      case "success":
        return <i className="bi bi-check-circle text-4xl text-green-400"></i>;
      case "error":
        return <i className="bi bi-exclamation-triangle text-4xl text-red-400"></i>;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "loading":
        return "border-cyan-500/30 bg-cyan-500/10";
      case "success":
        return "border-green-500/30 bg-green-500/10";
      case "error":
        return "border-red-500/30 bg-red-500/10";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-black to-slate-900 p-4">
      <div className="mx-auto w-full max-w-sm">
        <div className={`rounded-2xl border ${getStatusColor()} bg-gradient-to-br from-slate-900/80 to-black/80 p-8 shadow-[0_0_80px_-20px_rgba(0,200,255,0.25)] text-center`}>
          <div className="mb-6">
            {getStatusIcon()}
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-4">
            {status === "loading" && "Confirming Email..."}
            {status === "success" && "Email Confirmed!"}
            {status === "error" && "Confirmation Failed"}
          </h1>
          
          <p className="text-white/70 mb-6">
            {status === "loading" && "Please wait while we verify your email address."}
            {status === "success" && "Your email has been successfully confirmed. Redirecting to your dashboard..."}
            {status === "error" && message}
          </p>

          {status === "success" && (
            <div className="flex items-center justify-center gap-2 text-green-400 text-sm">
              <i className="bi bi-arrow-clockwise animate-spin"></i>
              <span>Redirecting...</span>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <button
                onClick={() => router.push("/login")}
                className="w-full rounded-md bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 font-medium hover:opacity-90"
              >
                Back to Login
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full rounded-md border border-white/15 bg-white/5 px-4 py-2 hover:bg-white/10 text-white/70"
              >
                Try Again
              </button>
            </div>
          )}

          {status === "loading" && (
            <div className="flex items-center justify-center gap-2 text-cyan-400 text-sm">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-black to-slate-900 p-4">
        <div className="mx-auto w-full max-w-sm">
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 bg-gradient-to-br from-slate-900/80 to-black/80 p-8 shadow-[0_0_80px_-20px_rgba(0,200,255,0.25)] text-center">
            <div className="mb-6">
              <i className="bi bi-hourglass-split text-4xl text-cyan-400 animate-spin"></i>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Loading...</h1>
            <p className="text-white/70">Please wait...</p>
          </div>
        </div>
      </div>
    }>
      <ConfirmEmailContent />
    </Suspense>
  );
}
