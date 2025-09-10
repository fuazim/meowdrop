"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Lang = "en" | "id";
type Dict = Record<string, { en: string; id: string }>;

const dict: Dict = {
  "nav.projects": { en: "Projects", id: "Proyek" },
  "nav.login": { en: "Login", id: "Masuk" },
  "nav.signout": { en: "Sign out", id: "Keluar" },
  "nav.title": { en: "Airdrop Tracker", id: "Airdrop Tracker" },

  "page.projects.title": { en: "Projects", id: "Proyek" },
  "page.projects.subtitle": {
    en: "Track and manage your airdrop progress",
    id: "Lacak dan kelola progres airdrop Anda",
  },
  "form.toggle.open": { en: "Add Project", id: "Tambah Proyek" },
  "form.toggle.close": { en: "Close Form", id: "Tutup Form" },

  "form.projectName": { en: "Project Name", id: "Nama Proyek" },
  "form.projectName.ph": { en: "e.g. StarkNet Quests", id: "mis. StarkNet Quests" },
  "form.loginType": { en: "Login Type", id: "Jenis Masuk" },
  "form.loginType.ph": { en: "Select login type", id: "Pilih jenis masuk" },

  "form.walletType": { en: "Wallet Type", id: "Jenis Wallet" },
  "form.walletType.ph": { en: "Select wallet", id: "Pilih wallet" },
  "form.walletType.add": { en: "+ Add Wallet Type", id: "+ Tambah Jenis Wallet" },
  "form.walletType.new.ph": { en: "New wallet name", id: "Nama wallet baru" },

  "form.email": { en: "Email", id: "Email" },
  "form.email.ph": { en: "your@email.com", id: "email@anda.com" },

  "form.walletAddress": { en: "Wallet Address", id: "Alamat Wallet" },
  "form.walletAddress.ph": {
    en: "0x... or chain-specific address",
    id: "0x... atau alamat sesuai chain",
  },

  "form.socialPlatform": { en: "Social Platform", id: "Platform Sosial" },
  "form.socialPlatform.ph": { en: "Select platform", id: "Pilih platform" },
  "form.socialPlatform.add": { en: "+ Add Social Type", id: "+ Tambah Jenis Sosial" },
  "form.socialPlatform.new.ph": { en: "New platform name", id: "Nama platform baru" },

  "form.username": { en: "Username", id: "Nama Pengguna" },
  "form.username.ph": { en: "@username", id: "@username" },

  "form.tasks": { en: "Tasks", id: "Tugas" },
  "form.tasks.ph": { en: "Task", id: "Tugas" },
  "form.tasks.add": { en: "+ Add Task", id: "+ Tambah Tugas" },
  "common.remove": { en: "Remove", id: "Hapus" },

  "form.links": { en: "Project Links (multiple)", id: "Tautan Proyek (bisa beberapa)" },
  "form.links.ph": { en: "https://example.com/path", id: "https://contoh.com/path" },
  "form.links.add": { en: "+ Add Link", id: "+ Tambah Tautan" },

  "form.faucet": { en: "Faucet Link (optional)", id: "Tautan Faucet (opsional)" },

  "form.status": { en: "Status", id: "Status" },
  "status.on": { en: "On Progress", id: "Dalam Proses" },
  "status.done": { en: "Finished", id: "Selesai" },

  "form.result": { en: "Result (earned)", id: "Hasil (didapat)" },
  "form.result.ph": { en: "e.g. 500 points / 10 tokens", id: "mis. 500 poin / 10 token" },

  "form.submit.add": { en: "Add Project", id: "Tambah Proyek" },
  "form.submit.save": { en: "Save", id: "Simpan" },
  "form.submit.saving": { en: "Saving...", id: "Menyimpan..." },

  "list.loading": { en: "Loading...", id: "Memuat..." },
  "list.empty": { en: "No projects yet. Add above.", id: "Belum ada proyek. Tambahkan di atas." },
  "card.result": { en: "Result:", id: "Hasil:" },
  "card.work": { en: "Work on Task", id: "Kerjakan Tugas" },
  "card.faucet": { en: "Claim Faucet", id: "Klaim Faucet" },
  "card.doneToday": { en: "done today", id: "selesai hari ini" },
 
   "detail.title": { en: "Edit Project Details", id: "Ubah Detail Proyek" },
   "common.back": { en: "Back to Projects", id: "Kembali ke Proyek" },
   "filter.all": { en: "All", id: "Semua" },
   "list.empty_filter": {
     en: "No projects match the current filter.",
     id: "Tidak ada proyek yang cocok dengan filter saat ini.",
   },
   "detail.subtitle": { en: "Edit project details", id: "Ubah detail proyek" },
   "detail.delete": { en: "Delete", id: "Hapus" },
  // Toasts
  "toast.saved": { en: "Project saved successfully", id: "Proyek berhasil disimpan" },
  "toast.created": { en: "Project created successfully", id: "Proyek berhasil dibuat" },

  // Auth
  "auth.login": { en: "Login", id: "Masuk" },
  "auth.signup": { en: "Sign Up", id: "Daftar" },
  "auth.email": { en: "Email", id: "Email" },
  "auth.password": { en: "Password", id: "Kata Sandi" },
  "auth.or": { en: "or", id: "atau" },
  "auth.continue.google": { en: "Continue with Google", id: "Lanjut dengan Google" },
  "auth.processing": { en: "Processing...", id: "Memproses..." },
  "auth.login.cta": { en: "Login", id: "Masuk" },
  "auth.signup.cta": { en: "Create Account", id: "Buat Akun" },
};

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof dict, opts?: { n?: number }) => string;
};

const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("lang")) as Lang | null;
    if (saved === "en" || saved === "id") {
      setLang(saved);
      return;
    }
    // Auto-detect system language on first load
    if (typeof navigator !== "undefined") {
      const sys = navigator.language.toLowerCase();
      if (sys.startsWith("id")) setLang("id");
      else setLang("en");
    }
  }, []);
  const value = useMemo<Ctx>(() => ({
    lang,
    setLang: (l) => {
      setLang(l);
      if (typeof window !== "undefined") localStorage.setItem("lang", l);
    },
    t: (key) => dict[key]?.[lang] ?? key,
  }), [lang]);
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
