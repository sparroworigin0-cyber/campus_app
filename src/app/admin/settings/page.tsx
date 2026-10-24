import { requireRole } from "@/lib/auth";
import { adminError } from "@/lib/adminErrors";
import { adminSetDefaultFee } from "../actions";

export default async function AdminSettings({ searchParams }: { searchParams: { error?: string } }) {
  const { sb } = await requireRole("admin");
  const { data: s } = await sb.from("app_settings").select("value").eq("key", "default_delivery_fee").maybeSingle();
  const { data: fb } = await sb.from("feedback").select("id,message,created_at,user:users(full_name,email)").order("created_at", { ascending: false }).limit(20);
  const err = adminError(searchParams.error);
  return (
    <main className="wrap stack">
      <h1>Settings</h1>
      {err && <p className="err" role="alert">{err}</p>}
      <form action={adminSetDefaultFee} className="card stack">
        <b>Default delivery charge (₹)</b>
        <small>Applies to new orders only. Existing orders keep their charge.</small>
        <input name="fee" type="number" min="0" max="1000" step="1" defaultValue={s?.value ?? "30"} />
        <button className="btn">Save</button>
      </form>
      <h1>Feedback</h1>
      {!fb?.length && <p className="mute">No feedback yet.</p>}
      {fb?.map((m: any) => {
        const u = Array.isArray(m.user) ? m.user[0] : m.user;
        return (
          <div key={m.id} className="card stack">
            <small>{u?.full_name || u?.email || "Deleted user"} · {new Date(m.created_at).toLocaleString()}</small>
            <p style={{ margin: 0 }}>{m.message}</p>
          </div>
        );
      })}
    </main>
  );
}
