"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import ProjectForm from "@/components/ProjectForm";

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: "" });
  const [filterStatus, setFilterStatus] = useState<string>("All");

  const filteredProjects = projects.filter(p => {
    if (filterStatus === "All") return true;
    return p.status === filterStatus;
  });

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

  const onCreate = async (projectData: Partial<Project>) => {
    setSaving(true);
    setError(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      router.replace("/login");
      return { error: { message: "User not authenticated" } };
    }

    const payload = {
      ...projectData,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from("projects")
      .insert(payload)
      .select()
      .single();

    setSaving(false);

    if (error) {
      return { error };
    } else {
      setProjects((p) => [data as Project, ...p]);
      setShowForm(false);
      setToast({ show: true, msg: t("toast.created") });
      setTimeout(() => setToast({ show: false, msg: "" }), 2500);
      return { error: null };
    }
  };

  // LocalStorage helper functions for task completion
  const getStorageKey = useCallback((projectId: string) => `task_completions_${projectId}`, []);

  const saveTaskCompletionsToStorage = useCallback((projectId: string, completions: boolean[]) => {
    try {
      const data = {
        completions,
        timestamp: Date.now()
      };
      localStorage.setItem(getStorageKey(projectId), JSON.stringify(data));
      console.log('🔥 Saved to localStorage:', getStorageKey(projectId), data);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [getStorageKey]);

  const loadTaskCompletionsFromStorage = useCallback((projectId: string, taskCount: number): boolean[] => {
    try {
      const stored = localStorage.getItem(getStorageKey(projectId));
      console.log('🔥 Loading from localStorage:', getStorageKey(projectId), stored);
      if (!stored) return new Array(taskCount).fill(false);

      const data = JSON.parse(stored);
      
      // Get current time in Jakarta (WIB = UTC+7)
      const now = new Date();
      const jakartaTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // UTC+7
      const currentDate = jakartaTime.toISOString().slice(0, 10); // YYYY-MM-DD
      
      // Get the date when data was saved
      const savedDate = new Date(data.timestamp);
      const savedJakartaTime = new Date(savedDate.getTime() + (7 * 60 * 60 * 1000));
      const savedDateString = savedJakartaTime.toISOString().slice(0, 10);
      
      console.log('🔥 Current Jakarta date:', currentDate);
      console.log('🔥 Saved date:', savedDateString);
      
      // Check if data is from a different day (reset at 00:00 Jakarta time)
      if (currentDate !== savedDateString) {
        // Clear data from previous day
        localStorage.removeItem(getStorageKey(projectId));
        console.log('🔥 Data expired (new day), cleared localStorage');
        return new Array(taskCount).fill(false);
      }

      // Ensure array length matches current task count
      const completions = data.completions || [];
      const result = new Array(taskCount).fill(false);
      for (let i = 0; i < Math.min(completions.length, taskCount); i++) {
        result[i] = completions[i] || false;
      }
      
      console.log('🔥 Loaded completions:', result);
      return result;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return new Array(taskCount).fill(false);
    }
  }, [getStorageKey]);

  // Toggle per-task checkbox on cards using localStorage
  const toggleTask = useCallback((projectId: string, index: number) => {
    console.log('🔥 Toggle task called!', projectId, index);
    
    setProjects((prev) => {
      const project = prev.find(p => p.id === projectId);
      if (!project) return prev;
      
      const tasksArr = Array.isArray(project.tasks) ? (project.tasks as string[]) : [];
      
      // Get current completions - try from state first, then localStorage
      let currentCompletions: boolean[];
      if (project.task_progress) {
        const today = new Date().toISOString().slice(0, 10);
        currentCompletions = project.task_progress[today] || loadTaskCompletionsFromStorage(projectId, tasksArr.length);
      } else {
        currentCompletions = loadTaskCompletionsFromStorage(projectId, tasksArr.length);
      }
      
      // Toggle the specific task
      const newCompletions = [...currentCompletions];
      newCompletions[index] = !newCompletions[index];
      
      console.log('🔥 Current completions:', currentCompletions);
      console.log('🔥 New completions:', newCompletions);
      
      // Save to localStorage
      saveTaskCompletionsToStorage(projectId, newCompletions);
      
      // Return updated projects with new task_progress
      return prev.map((p) => {
        if (p.id !== projectId) return p;
        const today = new Date().toISOString().slice(0, 10);
        const tempState: Record<string, boolean[]> = { [today]: newCompletions };
        return { ...p, task_progress: tempState } as Project;
      });
    });
  }, [loadTaskCompletionsFromStorage, saveTaskCompletionsToStorage]);

  return (
    <div className="space-y-8 pb-20 sm:pb-8">
      <div>
        <h1 className="text-2xl font-semibold">{t("page.projects.title")}</h1>
        <p className="text-white/60">{t("page.projects.subtitle")}</p>
      </div>

      {/* Filter and Add Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-1">
          <button
            onClick={() => setFilterStatus("All")}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${filterStatus === "All" ? "bg-cyan-500/20 text-cyan-300" : "text-white/60 hover:bg-white/10"}`}
          >
            {t("filter.all")}
          </button>
          <button
            onClick={() => setFilterStatus("On Progress")}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${filterStatus === "On Progress" ? "bg-cyan-500/20 text-cyan-300" : "text-white/60 hover:bg-white/10"}`}
          >
            {t("status.on")}
          </button>
          <button
            onClick={() => setFilterStatus("Finished")}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${filterStatus === "Finished" ? "bg-emerald-500/20 text-emerald-300" : "text-white/60 hover:bg-white/10"}`}
          >
            {t("status.done")}
          </button>
        </div>
        {/* Desktop Button */}
        <div className="hidden sm:flex">
          <button
            type="button"
            onClick={() => setShowForm((s) => !s)}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 font-medium hover:opacity-90 min-w-[14rem] transition-all"
          >
            <i className={`bi ${showForm ? "bi-x-lg" : "bi-plus-lg"}`}></i>
            {showForm ? t("form.toggle.close") : t("form.toggle.open")}
          </button>
        </div>
      </div>

      {/* Mobile Floating Button */}
      <div className="sm:hidden fixed bottom-6 right-6 z-50">
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 ${
            showForm 
              ? "bg-red-500 hover:bg-red-600" 
              : "bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90"
          } flex items-center justify-center`}
        >
          <i className={`bi text-white text-xl ${showForm ? "bi-x-lg" : "bi-plus-lg"}`}></i>
        </button>
      </div>

      {showForm && (
        <ProjectForm
          onSave={onCreate}
          isSaving={saving}
          isEdit={false}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="text-white/70">{t("list.loading")}</div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-white/60 col-span-1 md:col-span-2 text-center py-8">{t("list.empty_filter")}</div>
        ) : (
          filteredProjects.map((p) => (
            <div
              key={p.id}
              className="group web3-glow flex flex-col rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-4 backdrop-blur-sm shadow-lg hover:shadow-cyan-500/20 hover:border-cyan-400/30 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="flex-grow">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold tracking-tight group-hover:text-cyan-300">{p.name}</h3>
                  <div className="flex items-center gap-2 flex-shrink-0">
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
                {/* Login info row */}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/70">
                  {p.login_type && (
                    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2 py-0.5">
                      {p.login_type}
                    </span>
                  )}
                  {p.login_type === "Wallet" && p.wallet_type && (
                    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2 py-0.5">
                      {p.wallet_type}
                    </span>
                  )}
                  {p.login_type === "Wallet" && p.wallet_address && (
                    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2 py-0.5">
                      {`${(p.wallet_address as string).slice(0, 6)}...${(p.wallet_address as string).slice(-4)}`}
                    </span>
                  )}
                  {p.login_type === "Email" && p.contact_email && (
                    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2 py-0.5">
                      {p.contact_email}
                    </span>
                  )}
                  {p.login_type === "Social Media" && p.social_type && (
                     <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2 py-0.5">
                      {p.social_type}
                    </span>
                  )}
                  {p.login_type === "Social Media" && p.social_username && (
                    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2 py-0.5">
                      {p.social_username}
                    </span>
                  )}
                </div>

                {(() => {
                  const ts = Array.isArray(p.tasks) ? p.tasks as string[] : [];
                  if (!ts.length) return null;
                  let completions: boolean[];
                  if (p.task_progress) {
                    const today = new Date().toISOString().slice(0, 10);
                    completions = p.task_progress[today] || loadTaskCompletionsFromStorage(p.id, ts.length);
                  } else {
                    completions = loadTaskCompletionsFromStorage(p.id, ts.length);
                  }
                  const done = completions.filter(Boolean).length;
                  const total = ts.length;
                  const pct = total ? Math.round((done / total) * 100) : 0;
                  return (
                    <div className="mt-3">
                      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500 ease-out web3-progress-bar" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="mt-1 text-[11px] text-white/60">{done}/{total} {t("card.doneToday")}</p>
                    </div>
                  );
                })()}

                {p.status === "Finished" && p.result && (
                  <div className="mt-3">
                    <span className="inline-block rounded-full bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-1.5 text-sm font-bold text-white shadow-lg">
                      {t("card.result")} {p.result}
                    </span>
                  </div>
                )}

                {Array.isArray(p.tasks) && p.tasks.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {p.tasks.map((task, i) => {
                      const tasksArr = Array.isArray(p.tasks) ? (p.tasks as string[]) : [];
                      let completions: boolean[];
                      if (p.task_progress) {
                        const today = new Date().toISOString().slice(0, 10);
                        completions = p.task_progress[today] || loadTaskCompletionsFromStorage(p.id, tasksArr.length);
                      } else {
                        completions = loadTaskCompletionsFromStorage(p.id, tasksArr.length);
                      }
                      const checked = completions[i] || false;
                      const linksArr = Array.isArray(p.links) ? (p.links as string[]) : [];
                      const taskLink = linksArr[i];

                      return (
                        <div key={i} className="flex items-center gap-2 text-sm text-white/80 select-none">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => { e.stopPropagation(); toggleTask(p.id, i); }}
                            className="w-4 h-4 rounded border-2 border-cyan-500/50 bg-transparent text-cyan-500 focus:ring-2 focus:ring-cyan-500/30 focus:ring-offset-0 cursor-pointer transition-all duration-300 flex-shrink-0"
                            style={{ accentColor: checked ? '#10b981' : '#06b6d4' }}
                          />
                          <span className={`flex-1 transition-all duration-300 ${checked ? "line-through decoration-cyan-400 decoration-2 opacity-60" : "opacity-90"}`}>
                            {task}
                          </span>
                          {taskLink && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (typeof window !== "undefined") {
                                  window.open(taskLink, "_blank", "noopener,noreferrer");
                                }
                              }}
                              className="px-3 py-1 rounded-md text-xs font-medium transition-all duration-300 flex-shrink-0 bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-500/30"
                            >
                              {t("card.work")}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                {p.faucet_link ? (
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
                ) : <div />}
                <Link
                  href={`/projects/${p.id}`}
                  className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25"
                >
                  <i className="bi bi-pencil-square"></i>
                  Edit
                </Link>
              </div>
            </div>
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
