"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useI18n } from "@/lib/i18n";

type Project = {
  id?: string;
  user_id?: string;
  name: string;
  details?: string | null;
  chain?: string | null;
  status?: string | null;
  created_at?: string;
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
};

type ProjectFormProps = {
  project?: Project | null;
  onSave: (project: Partial<Project>) => Promise<{ error: any }>;
  isSaving: boolean;
  isEdit?: boolean;
};

export default function ProjectForm({ project, onSave, isSaving, isEdit = false }: ProjectFormProps) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [status, setStatus] = useState("On Progress");
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
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const [walletTypeOptions, setWalletTypeOptions] = useState<string[]>([]);
  const [socialTypeOptions, setSocialTypeOptions] = useState<string[]>([]);
  const [addingWalletType, setAddingWalletType] = useState(false);
  const [addingSocialType, setAddingSocialType] = useState(false);
  const [newWalletType, setNewWalletType] = useState("");
  const [newSocialType, setNewSocialType] = useState("");

  useEffect(() => {
    if (project) {
      setName(project.name || "");
      setStatus(project.status || "On Progress");
      setLoginType(project.login_type || "");
      setWalletType(project.wallet_type || "");
      setWalletAddress(project.wallet_address || "");
      setContactEmail(project.contact_email || "");
      setSocialType(project.social_type || "");
      setSocialUsername(project.social_username || "");
      const taskList = Array.isArray(project.tasks) && project.tasks.length > 0 ? (project.tasks as string[]) : [""];
      setTasks(taskList);
      const linkList = Array.isArray(project.links) && project.links.length > 0 ? (project.links as string[]) : [""];
      setLinks(linkList);
      setLinkErrors(linkList.map(() => false));
      setFaucetLink(project.faucet_link || "");
      setResult(project.result || "");
    }
  }, [project]);

  useEffect(() => {
    const fetchTypes = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id;
      if (uid) {
        const [{ data: w }, { data: s }] = await Promise.all([
          supabase.from("wallet_types").select("name").order("name"),
          supabase.from("social_types").select("name").order("name"),
        ]);
        setWalletTypeOptions((w || []).map((r: { name: string }) => r.name));
        setSocialTypeOptions((s || []).map((r: { name: string }) => r.name));
      }
    };
    fetchTypes();
  }, []);

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
    const hasInvalidLink = linkErrors.some(Boolean);
    const badFaucet = faucetLink ? !isValidUrl(faucetLink) : false;
    if (badFaucet || hasInvalidLink) return false;
    if (!name.trim()) return false;
    if (status === "Finished" && !result.trim()) return false;
    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanLinks = (links || []).map((l) => l.trim()).filter(Boolean);
    const cleanTasks = (tasks || []).map((t) => t.trim()).filter(Boolean);

    const payload: Partial<Project> = {
      name,
      status,
      login_type: loginType || null,
      wallet_type: loginType === "Wallet" ? walletType || null : null,
      wallet_address: loginType === "Wallet" ? walletAddress || null : null,
      contact_email: loginType === "Email" ? contactEmail || null : null,
      social_type: loginType === "Social Media" ? socialType || null : null,
      social_username: loginType === "Social Media" ? socialUsername || null : null,
      tasks: cleanTasks,
      links: cleanLinks,
      faucet_link: faucetLink || null,
      result: status === "Finished" ? result || null : null,
    };

    const { error: saveError } = await onSave(payload);
    if (saveError) {
      setError(saveError.message);
    }
  };

  const handleAddNewWalletType = async () => {
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
  };

  const handleAddNewSocialType = async () => {
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
  };

  return (
    <form onSubmit={handleSave} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
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
              onChange={(e) => {
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
                  onClick={handleAddNewWalletType}
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
                    onClick={handleAddNewSocialType}
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
          {t("form.tasks")} & {t("form.links")}
        </label>
        {tasks.map((taskItem, idx) => (
          <div key={idx} className="flex flex-col sm:flex-row gap-2 mt-2">
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
            <input
              value={links[idx] || ""}
              onChange={(e) => {
                const copy = [...links];
                copy[idx] = e.target.value;
                setLinks(copy);
                const err = !isValidUrl(e.target.value);
                const errs = [...linkErrors];
                errs[idx] = err;
                setLinkErrors(errs);
              }}
              placeholder={`${t("form.links.ph")} ${idx + 1}`}
              className={`flex-1 rounded-md border ${linkErrors[idx] ? "border-red-500/60" : "border-white/10"} bg-black/40 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500`}
            />
            <button
              type="button"
              className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-red-200 hover:bg-red-500/20 sm:w-auto w-full"
              onClick={() => {
                setTasks((l) => l.filter((_, i) => i !== idx));
                setLinks((l) => l.filter((_, i) => i !== idx));
                setLinkErrors((e) => e.filter((_, i) => i !== idx));
              }}
              disabled={tasks.length === 1 && isEdit === false}
            >
              {t("common.remove")}
            </button>
          </div>
        ))}
        <button
          type="button"
          className="mt-2 rounded-md border border-white/10 px-3 py-2 hover:bg-white/10 w-full sm:w-auto"
          onClick={() => { 
            setTasks((l) => [...l, ""]); 
            setLinks((l) => [...l, ""]); 
            setLinkErrors((e) => [...e, false]); 
          }}
        >
          {t("form.tasks.add")}
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
        <button disabled={isSaving || !canSubmit()} className="flex items-center gap-2 rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 font-medium hover:opacity-90 disabled:opacity-50">
          <svg width="16" height="16" fill="currentColor"><path d="M8 1v6H2v2h6v6h2V9h6V7H10V1H8z"/></svg>
          {isEdit ? (isSaving ? t("form.submit.saving") : t("form.submit.save")) : t("form.submit.add")}
        </button>
      </div>
    </form>
  );
}