"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";

export default function Navbar() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const { lang, setLang, t } = useI18n();

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setEmail(data.user?.email ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/10 bg-black/60 backdrop-blur supports-[backdrop-filter]:bg-black/40">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href={email ? "/projects" : "/"} className="flex items-center gap-2">
          <Image src="/images/meowdrop.png" alt="Meowdrop" width={100} height={100} className="rounded" />
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <div className="hidden sm:flex items-center rounded-md border border-white/15 bg-white/5 overflow-hidden min-w-[5.5rem]">
            <button
              onClick={() => setLang("en")}
              aria-label="English"
              title="English"
              className={`w-12 h-8 flex items-center justify-center text-[11px] font-medium tracking-wide leading-none transition ${lang === "en" ? "bg-white/15" : "hover:bg-white/10"}`}
            >
              EN
            </button>
            <button
              onClick={() => setLang("id")}
              aria-label="Indonesia"
              title="Indonesia"
              className={`w-12 h-8 flex items-center justify-center text-[11px] font-medium tracking-wide leading-none transition ${lang === "id" ? "bg-white/15" : "hover:bg-white/10"}`}
            >
              ID
            </button>
          </div>
          {email ? (
            <>
              <span className="text-white/60 hidden sm:inline">{email}</span>
              <button
                onClick={signOut}
                className="rounded-md bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 min-w-[6.5rem]"
              >
                {t("nav.signout")}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md border border-white/15 px-3 py-1.5 hover:bg-white/5 inline-flex justify-center min-w-[5.5rem]"
            >
              {t("nav.login")}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
