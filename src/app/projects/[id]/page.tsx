"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

type Project = {
  id: string;
  user_id: string;
  name: string;
  details: string | null;
  chain?: string | null;
  status?: string | null;
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

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const [project, setProject] = useState<Project | null>(null);
  const [name, setName] = useState("");
  // legacy details removed in UI
  const [status, setStatus] = useState("On Progress");
  // New states
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletTypeOptions, setWalletTypeOptions] = useState<string[]>([]);
  const [socialTypeOptions, setSocialTypeOptions] = useState<string[]>([]);
  const [addingWalletType, setAddingWalletType] = useState(false);
  const [addingSocialType, setAddingSocialType] = useState(false);
  const [newWalletType, setNewWalletType] = useState("");
  const [newSocialType, setNewSocialType] = useState("");

  const isValidUrl = (val: string) => {
    if (!val) return true;
    try {
      const u = new URL(val);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  const canSave = () => {
    const hasInvalidLink = linkErrors.some(Boolean) || !links.every((l) => isValidUrl(l));
    const badFaucet = faucetLink ? !isValidUrl(faucetLink) : false;
    if (badFaucet || hasInvalidLink) return false;
    if (!name.trim()) return false;
    if (status === "Finished" && !result.trim()) return false;
    return true;
  };

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return router.replace("/login");
      const { data, error } = await supabase
        .from("projects")
        .select(
          "id, user_id, name, details, status, login_type, wallet_type, wallet_address, contact_email, social_type, social_username, detail_task, links, faucet_link, result, tasks, task_progress"
        )
        .eq("id", params.id)
        .single();
      if (error) setError(error.message);
      else if (data) {
        setProject(data as Project);
        setName(data.name || "");
        // no-op for legacy details
        setStatus(data.status || "On Progress");
        setLoginType(data.login_type || "");
        setWalletType(data.wallet_type || "");
        setWalletAddress(data.wallet_address || "");
        setContactEmail(data.contact_email || "");
        setSocialType(data.social_type || "");
        setSocialUsername(data.social_username || "");
        setTasks(Array.isArray(data.tasks) ? (data.tasks as string[]) : []);
        const ls = Array.isArray(data.links) ? (data.links as string[]) : [""];
        setLinks(ls);
        setLinkErrors(ls.map(() => false));
        setFaucetLink(data.faucet_link || "");
        setFaucetError(false);
        setResult(data.result || "");
      }
      // Load reusable types for dropdowns
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
  }, [params.id, router]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const cleanLinks = (links || []).map((l) => l.trim()).filter(Boolean);
    const cleanTasks = (tasks || []).map((t) => t.trim()).filter(Boolean);
    const payload: Partial<Project> = {
      name,
      details: null,
      status,
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
      result: status === "Finished" ? result || null : null,
    };

    const { error } = await supabase
      .from("projects")
      .update(payload)
      .eq("id", params.id);
    if (error) setError(error.message);
    setSaving(false);
    if (!error) router.push("/projects?saved=1");
  };

  const remove = async () => {
    if (!confirm("Hapus project ini?")) return;
    const { error } = await supabase.from("projects").delete().eq("id", params.id);
    if (error) return setError(error.message);
    router.push("/projects");
  };

  if (loading) return <div>{t("list.loading")}</div>;
  if (!project)
    return (
      <div>
        <p>Project not found / Proyek tidak ditemukan.</p>
        <Link href="/projects" className="text-cyan-300 underline">Back / Kembali</Link>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="text-white/60">{t("detail.subtitle")}</p>
        </div>
        <button onClick={remove} className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-red-200 hover:bg-red-500/20">
          {t("detail.delete")}
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={save} className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
        <div>
          <label className="text-sm text-white/70">{t("form.projectName")}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-white/70">{t("form.loginType")}</label>
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
              <label className="text-sm text-white/70">{t("form.walletType")}</label>
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
              <label className="text-sm text-white/70">{t("form.email")}</label>
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
              <label className="text-sm text-white/70">{t("form.walletAddress")}</label>
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
                <label className="text-sm text-white/70">{t("form.socialPlatform")}</label>
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
                <label className="text-sm text-white/70">{t("form.username")}</label>
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
          <label className="text-sm text-white/70">{t("form.tasks")}</label>
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
            <label className="text-sm text-white/70">{t("form.links")}</label>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-white/70">{t("form.faucet")}</label>
            <input
              value={faucetLink}
              onChange={(e) => { setFaucetLink(e.target.value); setFaucetError(!isValidUrl(e.target.value)); }}
              placeholder="https://faucet.example.com"
              className={`mt-1 w-full rounded-md border ${faucetError ? "border-red-500/60" : "border-white/10"} bg-black/40 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500`}
            />
          </div>
          <div>
            <label className="text-sm text-white/70">{t("form.status")}</label>
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
            <label className="text-sm text-white/70">{t("form.result")}</label>
            <input
              value={result}
              onChange={(e) => setResult(e.target.value)}
              placeholder={t("form.result.ph")}
            className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      )}

        {/* Chain removed per request */}

        <div className="flex justify-end gap-2">
          <button
            type="submit"
            disabled={saving || !canSave()}
            className="rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 font-medium hover:opacity-90 disabled:opacity-50"
          >
            {saving ? t("form.submit.saving") : t("form.submit.save")}
          </button>
        </div>
      </form>
    </div>
  );
}
