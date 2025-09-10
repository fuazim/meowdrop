"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import ProjectForm from "@/components/ProjectForm";

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
};

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return router.replace("/login");
      const { data, error } = await supabase
        .from("projects")
        .select(
          "id, user_id, name, details, status, login_type, wallet_type, wallet_address, contact_email, social_type, social_username, detail_task, links, faucet_link, result, tasks"
        )
        .eq("id", params.id)
        .single();
      if (error) setError(error.message);
      else if (data) {
        setProject(data as Project);
      }
      setLoading(false);
    };
    init();
  }, [params.id, router]);

  const onSave = async (projectData: Partial<Project>) => {
    setSaving(true);
    setError(null);

    const { error } = await supabase
      .from("projects")
      .update(projectData)
      .eq("id", params.id);

    setSaving(false);

    if (error) {
      return { error };
    } else {
      router.push("/projects?saved=1");
      return { error: null };
    }
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
      <div>
        <Link href="/projects" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-4">
          <i className="bi bi-arrow-left-circle"></i>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{t("detail.title")}</h1>
            <p className="text-white/60">{project.name}</p>
          </div>
          <button onClick={remove} className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-red-200 hover:bg-red-500/20">
            {t("detail.delete")}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <ProjectForm
        project={project}
        onSave={onSave}
        isSaving={saving}
        isEdit={true}
      />
    </div>
  );
}
