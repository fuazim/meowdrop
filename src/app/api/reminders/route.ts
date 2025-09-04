import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { Resend } from "resend";

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: projects, error } = await supabaseAdmin
      .from("projects")
      .select("id, user_id, name, tasks, status")
      .eq("status", "On Progress");
    if (error) throw error;

    // Group by user_id
    type Item = { name: string; tasks: string[] };
    const byUser = new Map<string, Item[]>();
    for (const p of (projects || []) as Array<{ user_id: string; name: string; tasks: unknown }>) {
      const list = byUser.get(p.user_id) || [];
      const taskList = Array.isArray(p.tasks) ? (p.tasks as string[]) : [];
      list.push({ name: p.name, tasks: taskList });
      byUser.set(p.user_id, list);
    }

    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.REMINDER_FROM_EMAIL || "reminder@yourapp.local";
    const resend = resendKey ? new Resend(resendKey) : null;

    const results: Array<{ userId: string; email: string; status: string; preview?: string }> = [];
    for (const [userId, items] of byUser) {
      // Get user email via admin API
      const { data: userData, error: adminErr } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (adminErr || !userData?.user?.email) continue;
      const email = userData.user.email as string;

      const subject = "Daily Airdrop Tasks Reminder";
      const lines = items
        .map((i) => {
          const tl = (i.tasks || []).map((t) => `- ${t}`).join("\n");
          return `• ${i.name}\n${tl}`;
        })
        .join("\n\n");
      const text = `Hai!\n\nBerikut daftar task airdrop kamu yang masih On Progress:\n\n${lines}\n\nSemangat!`;

      if (resend) {
        const sent = await resend.emails.send({
          from: fromEmail,
          to: email,
          subject,
          text,
        });
        const status = sent?.data?.id ? "sent" : "queued";
        results.push({ userId, email, status });
      } else {
        results.push({ userId, email, status: "dry-run", preview: text.slice(0, 120) });
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
