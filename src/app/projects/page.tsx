"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";

type Project = {
  id: string;
  user_id: string;
  name: string;
  details: string | null;
  chain?: string | null;
  status?: string | null;
  created_at?: string;
  // New fields
  login_type?: string | null;
  wallet_type?: string | null;
  wallet_address?: string | null;
  contact_email?: string | null;
  social_type?: string | null;
  social_username?: string | null;
  detail_task?: string | null;
  links?: string[] | null;
  faucet_link?: string | null;
  result?: string | null;
  tasks?: string[] | null;
  task_progress?: Record<string, boolean[]> | null;
};

export default function ProjectsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  // New form states
  const [loginType, setLoginType] = useState<string>("");
  const [walletType, setWalletType] = useState<string>("");
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [contactEmail, setContactEmail] = useState<string>("");
  const [socialType, setSocialType] = useState<string>("");
  const [socialUsername, setSocialUsername] = useState<string>("");
  const [tasks, setTasks] = useState<string[]>([""]);
  const [links, setLinks] = useState<string[]>([""]);
  const [linkErrors, setLinkErrors] = useState<boolean[]>([false]);
  const [faucetLink, setFaucetLink] = useState<string>("");
  const [faucetError, setFaucetError] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("On Progress");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: "" });

  // Reusable types
  const [walletTypeOptions, setWalletTypeOptions] = useState<string[]>([]);
  const [socialTypeOptions, setSocialTypeOptions] = useState<string[]>([]);
  const [addingWalletType, setAddingWalletType] = useState(false);
  const [addingSocialType, setAddingSocialType] = useState(false);
  const [newWalletType, setNewWalletType] = useState("");
  const [newSocialType, setNewSocialType] = useState("");

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/login");
        return;
      }
      const { data, error } = await supabase
        .from("projects")
        .select(
          "id, user_id, name, details, status, created_at, login_type, wallet_type, wallet_address, contact_email, social_type, social_username, detail_task, links, faucet_link, result, tasks, task_progress"
        )
        .order("created_at", { ascending: false });
      if (error) setError(error.message);
      else setProjects(data || []);
      // Load reusable types
      const { data: sessionData2 } = await supabase.auth.getSession();
      const uid = sessionData2.session?.user?.id;
      if (uid) {
        const [{ data: w }, { data: s }] = await Promise.all([
          supabase.from("wallet_types").select("name").order("name"),
          supabase.from("social_types").select("name").order("name"),
        ]);
        setWalletTypeOptions((w || []).map((r: { name: string }) => r.name));
        setSocialTypeOptions((s || []).map((r: { name: string }) => r.name));
      }
      setLoading(false);
    };
    init();
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("saved") === "1") {
      setToast({ show: true, msg: t("toast.saved") });
      router.replace("/projects");
      const id = setTimeout(() => setToast({ show: false, msg: "" }), 2500);
      return () => clearTimeout(id);
    }
  }, [router, t]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return router.replace("/login");
    // Prepare clean links array (filter out empty strings)
    const cleanLinks = (links || []).map((l) => l.trim()).filter(Boolean);
    const cleanTasks = (tasks || []).map((t) => t.trim()).filter(Boolean);
    const payload: Partial<Project> & { user_id: string } = {
      name,
      user_id: user.id,
      login_type: loginType || null,
      wallet_type: loginType === "Wallet" ? walletType || null : null,
      wallet_address: loginType === "Wallet" ? walletAddress || null : null,
      contact_email: loginType === "Email" ? contactEmail || null : null,
      social_type: loginType === "Social" || loginType === "Social Media" ? socialType || null : null,
      social_username: loginType === "Social" || loginType === "Social Media" ? socialUsername || null : null,
      detail_task: null,
      tasks: cleanTasks,
      links: cleanLinks,
      faucet_link: faucetLink || null,
      status: status || "On Progress",
      result: status === "Finished" ? result || null : null,
    };

    const { data, error } = await supabase
      .from("projects")
      .insert(payload)
      .select(
        "id, user_id, name, details, status, created_at, login_type, wallet_type, wallet_address, contact_email, social_type, social_username, detail_task, links, faucet_link, result"
      )
      .single();
    if (error) setError(error.message);
    else {
      setProjects((p) => [data as Project, ...p]);
      setName("");
      setLoginType("");
      setWalletType("");
      setWalletAddress("");
      setContactEmail("");
      setSocialType("");
      setSocialUsername("");
      setTasks([""]);
      setLinks([""]);
      setLinkErrors([false]);
      setFaucetLink("");
      setFaucetError(false);
      setStatus("On Progress");
      setResult("");
      setShowForm(false);
      setToast({ show: true, msg: t("toast.created") });
      setTimeout(() => setToast({ show: false, msg: "" }), 2500);
    }
  };

  // URL validation helpers
  const isValidUrl = (val: string) => {
    if (!val) return true;
    try {
      const u = new URL(val);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  const canSubmit = () => {
    const hasInvalidLink = linkErrors.some(Boolean) || !links.every((l) => isValidUrl(l));
    const badFaucet = faucetLink ? !isValidUrl(faucetLink) : false;
    if (badFaucet || hasInvalidLink) return false;
    if (!name.trim()) return false;
    if (status === "Finished" && !result.trim()) return false;
    return true;
  };

  // Toggle per-task checkbox on cards
  const toggleTask = async (projectId: string, index: number) => {
    const today = new Date().toISOString().slice(0, 10);
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const tasksArr = Array.isArray(p.tasks) ? (p.tasks as string[]) : [];
        const state = { ...(p.task_progress || {}) } as Record<string, boolean[]>;
        const arr = (state[today] || Array(tasksArr.length).fill(false)).slice();
        arr[index] = !arr[index];
        const newState: Record<string, boolean[]> = { ...state, [today]: arr };
        supabase.from("projects").update({ task_progress: newState }).eq("id", p.id);
        return { ...p, task_progress: newState } as Project;
      })
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">{t("page.projects.title")}</h1>
        <p className="text-white/60">{t("page.projects.subtitle")}</p>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 font-medium hover:opacity-90 min-w-[14rem] transition-all"
        >
          <i className={`bi ${showForm ? "bi-x-lg" : "bi-plus-lg"}`}></i>
          {showForm ? t("form.toggle.close") : t("form.toggle.open")}
        </button>
      </div>

      {showForm && (
      <form onSubmit={onCreate} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
        <div>
          <label className="text-sm text-white/70 flex items-center gap-2">
            <i className="bi bi-file-earmark-text"></i>
            {t("form.projectName")}
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder={t("form.projectName.ph")}
            className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
          <label className="text-sm text-white/70 flex items-center gap-2">
            <i className="bi bi-box-arrow-in-right"></i>
            {t("form.loginType")}
          </label>
            <select
              value={loginType}
              onChange={(e) => setLoginType(e.target.value)}
              className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">{t("form.loginType.ph")}</option>
              <option value="Wallet">Wallet</option>
              <option value="Email">Email</option>
              <option value="Social Media">Social Media</option>
            </select>
          </div>

          {loginType === "Wallet" && (
            <div>
              <label className="text-sm text-white/70 flex items-center gap-2">
                <svg width="16" height="16" fill="currentColor" className="text-white/70"><path d="M2.5 4A1.5 1.5 0 0 0 1 5.5v5A1.5 1.5 0 0 0 2.5 12h9A1.5 1.5 0 0 0 13 10.5v-5A1.5 1.5 0 0 0 11.5 4h-9zm8 3h1a1 1 0 1 1 0 2h-1V7z"/></svg>
                {t("form.walletType")}
              </label>
              <select
                value={walletType}
                onChange={async (e) => {
                  const v = e.target.value;
                  if (v === "__add__") {
                    setAddingWalletType(true);
                    setWalletType("");
                  } else {
                    setAddingWalletType(false);
                    setWalletType(v);
                  }
                }}
                className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">{t("form.walletType.ph")}</option>
                {walletTypeOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
                <option value="__add__">{t("form.walletType.add")}</option>
              </select>
              {addingWalletType && (
                <div className="mt-2 flex gap-2">
                  <input
                    value={newWalletType}
                    onChange={(e) => setNewWalletType(e.target.value)}
                    placeholder={t("form.walletType.new.ph")}
                    className="flex-1 rounded-md border border-white/10 bg-black/40 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <button
                    type="button"
                    className="rounded-md border border-white/10 px-3 py-2 hover:bg-white/10"
                    onClick={async () => {
                      const n = newWalletType.trim();
                      if (!n) return;
                      const { data: sessionData } = await supabase.auth.getSession();
                      const user = sessionData.session?.user;
                      if (!user) return;
                      const { error } = await supabase.from("wallet_types").insert({ user_id: user.id, name: n });
                      if (!error) {
                        setWalletTypeOptions((opts) => Array.from(new Set([...opts, n])).sort());
                        setWalletType(n);
                        setNewWalletType("");
                        setAddingWalletType(false);
                      }
                    }}
                  >
                    {t("form.submit.save")}
                  </button>
                </div>
              )}
            </div>
          )}

          {loginType === "Email" && (
            <div>
              <label className="text-sm text-white/70 flex items-center gap-2">
                <svg width="16" height="16" fill="currentColor" className="text-white/70"><path d="M1.5 4h13a.5.5 0 0 1 .39.812l-6.5 7.5a.5.5 0 0 1-.78 0l-6.5-7.5A.5.5 0 0 1 1.5 4z"/></svg>
                {t("form.email")}
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder={t("form.email.ph")}
                className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          )}

          {loginType === "Wallet" && (
            <div className="sm:col-span-2">
              <label className="text-sm text-white/70 flex items-center gap-2">
                <svg width="16" height="16" fill="currentColor" className="text-white/70"><path d="M4 2a2 2 0 0 0-2 2v8l3-1 3 1 3-1 3 1V4a2 2 0 0 0-2-2H4z"/></svg>
                {t("form.walletAddress")}
              </label>
              <input
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder={t("form.walletAddress.ph")}
                className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          )}

          {loginType === "Social Media" && (
            <>
              <div>
                <label className="text-sm text-white/70 flex items-center gap-2">
                  <svg width="16" height="16" fill="currentColor" className="text-white/70"><path d="M12 1a1 1 0 0 1 1 1v9l-3-2-3 2-3-2-3 2V2a1 1 0 0 1 1-1h10z"/></svg>
                  {t("form.socialPlatform")}
                </label>
                <select
                  value={socialType}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "__add__") {
                      setAddingSocialType(true);
                      setSocialType("");
                    } else {
                      setAddingSocialType(false);
                      setSocialType(v);
                    }
                  }}
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">{t("form.socialPlatform.ph")}</option>
                  {socialTypeOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                  <option value="__add__">{t("form.socialPlatform.add")}</option>
                </select>
                {addingSocialType && (
                  <div className="mt-2 flex gap-2">
                    <input
                      value={newSocialType}
                      onChange={(e) => setNewSocialType(e.target.value)}
                      placeholder={t("form.socialPlatform.new.ph")}
                      className="flex-1 rounded-md border border-white/10 bg-black/40 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <button
                      type="button"
                      className="rounded-md border border-white/10 px-3 py-2 hover:bg-white/10"
                      onClick={async () => {
                        const n = newSocialType.trim();
                        if (!n) return;
                        const { data: sessionData } = await supabase.auth.getSession();
                        const user = sessionData.session?.user;
                        if (!user) return;
                        const { error } = await supabase.from("social_types").insert({ user_id: user.id, name: n });
                        if (!error) {
                          setSocialTypeOptions((opts) => Array.from(new Set([...opts, n])).sort());
                          setSocialType(n);
                          setNewSocialType("");
                          setAddingSocialType(false);
                        }
                      }}
                    >
                      {t("form.submit.save")}
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm text-white/70 flex items-center gap-2">
                  <svg width="16" height="16" fill="currentColor" className="text-white/70"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-5 6a5 5 0 0 1 10 0H3z"/></svg>
                  {t("form.username")}
                </label>
                <input
                  value={socialUsername}
                  onChange={(e) => setSocialUsername(e.target.value)}
                  placeholder={t("form.username.ph")}
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </>
          )}
        </div>

        <div>
          <label className="text-sm text-white/70 flex items-center gap-2">
            <svg width="16" height="16" fill="currentColor" className="text-white/70"><path d="M2 3h12v2H2V3zm0 4h12v2H2V7zm0 4h12v2H2v-2z"/></svg>
            {t("form.tasks")}
          </label>
          {tasks.map((taskItem, idx) => (
            <div key={idx} className="flex gap-2 mt-2">
              <input
                value={taskItem}
                onChange={(e) => {
                  const copy = [...tasks];
                  copy[idx] = e.target.value;
                  setTasks(copy);
                }}
                placeholder={`${t("form.tasks.ph")} ${idx + 1}`}
                className="flex-1 rounded-md border border-white/10 bg-black/40 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <button
                type="button"
                className="rounded-md border border-white/10 px-3 py-2 hover:bg-white/10"
                onClick={() => setTasks((l) => l.filter((_, i) => i !== idx))}
                disabled={tasks.length === 1}
              >
                {t("common.remove")}
              </button>
            </div>
          ))}
          <button
            type="button"
            className="mt-2 rounded-md border border-white/10 px-3 py-2 hover:bg-white/10"
            onClick={() => setTasks((l) => [...l, ""])}
          >
            {t("form.tasks.add")}
          </button>
        </div>

        <div>
          <label className="text-sm text-white/70 flex items-center gap-2">
            <svg width="16" height="16" fill="currentColor" className="text-white/70"><path d="M6.354 5.5H4a3 3 0 0 0 0 6h2.5v-1H4a2 2 0 1 1 0-4h2.354a.5.5 0 0 0 0-1zM12 5.5h-2.5v1H12a2 2 0 1 1 0 4H9.646a.5.5 0 0 0 0 1H12a3 3 0 0 0 0-6z"/><path d="M5 8.5h6v1H5z"/></svg>
            {t("form.links")}
          </label>
          {links.map((link, idx) => (
            <div key={idx} className="flex gap-2 mt-2">
              <input
                value={link}
                onChange={(e) => {
                  const copy = [...links];
                  copy[idx] = e.target.value;
                  setLinks(copy);
                  const err = !isValidUrl(e.target.value);
                  const errs = [...linkErrors];
                  errs[idx] = err;
                  setLinkErrors(errs);
                }}
                placeholder={`${t("form.links.ph")} - ${idx + 1}`}
                className={`flex-1 rounded-md border ${linkErrors[idx] ? "border-red-500/60" : "border-white/10"} bg-black/40 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500`}
              />
              <button
                type="button"
                className="rounded-md border border-white/10 px-3 py-2 hover:bg-white/10"
                onClick={() => setLinks((l) => l.filter((_, i) => i !== idx))}
                disabled={links.length === 1}
              >
                {t("common.remove")}
              </button>
            </div>
          ))}
          <button
            type="button"
            className="mt-2 rounded-md border border-white/10 px-3 py-2 hover:bg-white/10"
            onClick={() => { setLinks((l) => [...l, ""]); setLinkErrors((e) => [...e, false]); }}
          >
            {t("form.links.add")}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-white/70 flex items-center gap-2">
              <svg width="16" height="16" fill="currentColor" className="text-white/70"><path d="M8 1a1 1 0 0 1 1 1v1.5A2.5 2.5 0 0 0 11.5 6h.793a2 2 0 0 1 1.414.586l.707.707-1.414 1.414-.707-.707A1 1 0 0 0 12.293 8H11.5A3.5 3.5 0 0 1 8 4.5V2a1 1 0 0 1 1-1zM5 9a3 3 0 1 0 6 0H5z"/></svg>
              {t("form.faucet")}
            </label>
            <input
              value={faucetLink}
              onChange={(e) => { setFaucetLink(e.target.value); setFaucetError(!isValidUrl(e.target.value)); }}
              placeholder="https://faucet.example.com"
              className={`mt-1 w-full rounded-md border ${faucetError ? "border-red-500/60" : "border-white/10"} bg-black/40 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500`}
            />
          </div>
          <div>
            <label className="text-sm text-white/70 flex items-center gap-2">
              <svg width="16" height="16" fill="currentColor" className="text-white/70"><path d="M2 2h12v3H2V2zm0 4h12v8H2V6zm8 1H6v6h4V7z"/></svg>
              {t("form.status")}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="On Progress">{t("status.on")}</option>
              <option value="Finished">{t("status.done")}</option>
            </select>
          </div>
        </div>

        {status === "Finished" && (
          <div>
            <label className="text-sm text-white/70 flex items-center gap-2">
              <svg width="16" height="16" fill="currentColor" className="text-white/70"><path d="M3 2h10v2H3V2zm1 3h8l-1 9H5L4 5zm1 10h6v1H5v-1z"/></svg>
              {t("form.result")}
            </label>
            <input
              value={result}
              onChange={(e) => setResult(e.target.value)}
              placeholder={t("form.result.ph")}
              className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button disabled={!canSubmit()} className="flex items-center gap-2 rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 font-medium hover:opacity-90 disabled:opacity-50">
            <svg width="16" height="16" fill="currentColor"><path d="M8 1v6H2v2h6v6h2V9h6V7H10V1H8z"/></svg>
            {t("form.submit.add")}
          </button>
        </div>
      </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="text-white/70">{t("list.loading")}</div>
        ) : projects.length === 0 ? (
          <div className="text-white/60">{t("list.empty")}</div>
        ) : (
          projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="group web3-glow rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-4 backdrop-blur-sm shadow-lg hover:shadow-cyan-500/20 hover:border-cyan-400/30 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold tracking-tight group-hover:text-cyan-300">{p.name}</h3>
                <div className="flex items-center gap-2">
                  {p.status && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border backdrop-blur-sm ${
                      p.status === "Finished"
                        ? "border-emerald-500/40 text-emerald-300"
                        : "border-cyan-500/40 text-cyan-300"
                    }`}>
                      {p.status}
                    </span>
                  )}
                  <span className="text-xs text-white/50">{new Date(p.created_at || "").toLocaleDateString()}</span>
                </div>
              </div>
              {/* Login info row (no icons) */}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/70">
                {p.login_type && (
                  <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2 py-0.5">
                    {p.login_type}
                  </span>
                )}
                {p.login_type === "Wallet" && (
                  <>
                    {p.wallet_type && (
                      <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2 py-0.5">
                        {p.wallet_type}
                      </span>
                    )}
                    {p.wallet_address && (
                      <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2 py-0.5">
                        {`${(p.wallet_address as string).slice(0, 6)}...${(p.wallet_address as string).slice(-4)}`}
                      </span>
                    )}
                  </>
                )}
                {p.login_type === "Email" && p.contact_email && (
                  <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2 py-0.5">
                    {p.contact_email}
                  </span>
                )}
                {p.login_type === "Social Media" && (
                  <>
                    {p.social_type && (
                      <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2 py-0.5">
                        {p.social_type}
                      </span>
                    )}
                    {p.social_username && (
                      <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2 py-0.5">
                        {p.social_username}
                      </span>
                    )}
                  </>
                )}
              </div>
              {(() => {
                const today = new Date().toISOString().slice(0, 10);
                const ts = Array.isArray(p.tasks) ? p.tasks as string[] : [];
                const st = (p.task_progress || {}) as Record<string, boolean[]>;
                const done = (st[today] || []).filter(Boolean).length;
                const total = ts.length || 0;
                const pct = total ? Math.round((done / total) * 100) : 0;
                return total ? (
                  <div className="mt-2">
                    <div className="h-1.5 w-full rounded bg-white/10 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1 text-[11px] text-white/60">{done}/{total} {t("card.doneToday")}</p>
                  </div>
                ) : null;
              })()}
              {p.status === "Finished" && p.result && (
                <p className="mt-2 text-xs text-emerald-300">{t("card.result")} {p.result}</p>
              )}
              {Array.isArray(p.tasks) && p.tasks.length > 0 && (
                <div className="mt-3 space-y-2">
                  {p.tasks.map((t, i) => {
                    const today = new Date().toISOString().slice(0, 10);
                    const state = (p.task_progress || {}) as Record<string, boolean[]>;
                    const checked = !!(state[today]?.[i]);
                    const handleToggle = (e: React.MouseEvent | React.ChangeEvent) => {
                      e.preventDefault();
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (e as any).stopPropagation?.();
                      toggleTask(p.id, i);
                    };
                    return (
                      <div key={i} className="flex items-center gap-2 text-white/80 select-none">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={handleToggle}
                          onClick={handleToggle}
                          className="h-4 w-4 rounded border-white/20 bg-black/40"
                        />
                        <span
                          onClick={handleToggle}
                          className={`cursor-pointer transition-all duration-300 ${
                            checked ? "line-through decoration-cyan-400 decoration-2 opacity-60" : "opacity-90"
                          }`}
                        >
                          {t}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {Array.isArray(p.links) && p.links.map((l, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (typeof window !== "undefined") window.open(l as string, "_blank", "noopener,noreferrer");
                    }}
                    className="text-xs rounded-md border border-white/15 bg-white/5 px-2 py-1 hover:bg-white/10 backdrop-blur-sm"
                  >
                    {t("card.work")} {i + 1}
                  </button>
                ))}
                {p.faucet_link && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (typeof window !== "undefined") window.open(p.faucet_link as string, "_blank", "noopener,noreferrer");
                    }}
                    className="text-xs rounded-md border border-cyan-500/40 text-cyan-300 bg-cyan-500/5 px-2 py-1 hover:bg-white/10 backdrop-blur-sm"
                  >
                    {t("card.faucet")}
                  </button>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
      {toast.show && (
        <div className="fixed bottom-4 right-4 z-50 toast-pop rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.35)] backdrop-blur">
          {toast.msg}
        </div>
      )}
    </div>
  );
}
