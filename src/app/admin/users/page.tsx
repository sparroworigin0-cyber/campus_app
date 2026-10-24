import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { adminError } from "@/lib/adminErrors";
import ConfirmButton from "@/components/ConfirmButton";
import { adminDeleteUser, adminUpdateUser } from "../actions";

const TABS = { all: "All", customer: "Customers", agent: "Agents", admin: "Admins" } as const;

export default async function AdminUsers({ searchParams }: { searchParams: { r?: string; q?: string; error?: string } }) {
  const { sb, me } = await requireRole("admin");
  const r = searchParams.r && searchParams.r in TABS ? searchParams.r : "all";
  const term = (searchParams.q ?? "").replace(/[,()%*]/g, "").trim();
  let q = sb.from("users").select("*").order("created_at", { ascending: false }).limit(100);
  if (r !== "all") q = q.eq("role", r);
  if (term) q = q.or(`email.ilike.%${term}%,full_name.ilike.%${term}%`);
  const { data } = await q;
  const err = adminError(searchParams.error);

  return (
    <main className="wrap stack">
      <h1>Users</h1>
      {err && <p className="err" role="alert">{err}</p>}
      <form className="search" method="get">
        <input type="hidden" name="r" value={r} />
        <input name="q" defaultValue={term} placeholder="Search name or email" />
        <button className="btn ghost">Search</button>
      </form>
      <div className="tabs">
        {Object.entries(TABS).map(([k, label]) => <Link key={k} href={`/admin/users?r=${k}`} className={k === r ? "on" : ""}>{label}</Link>)}
      </div>
      {!data?.length && <p className="mute">No users found.</p>}
      {data?.map((u: any) => {
        const mine = u.id === me.id;
        return (
          <div key={u.id} className="card stack">
            <div className="row">
              <div><b>{u.full_name || "(no name)"}</b><br /><small>{u.email}{u.phone ? ` · ${u.phone}` : ""}</small></div>
              <span>
                <span className="pill">{u.role}{u.role === "agent" ? ` · ${u.agent_status}` : ""}</span>{" "}
                {!u.is_active && <span className="pill">deactivated</span>}
              </span>
            </div>
            {u.role === "admin" ? <small>{mine ? "This is you." : "Admin accounts can't be changed here."}</small> : (
              <div className="actions">
                <form action={adminUpdateUser} className="actions">
                  <input type="hidden" name="id" value={u.id} />
                  {(u.role === "customer" || u.agent_status !== "approved") && <button className="btn" name="action" value="approve_agent">{u.role === "customer" ? "Make agent" : "Approve agent"}</button>}
                  {u.role === "agent" && u.agent_status === "approved" && <button className="btn ghost" name="action" value="suspend_agent">Suspend agent</button>}
                  {u.role === "agent" && <button className="btn ghost" name="action" value="make_customer">Make customer</button>}
                  {u.is_active
                    ? <button className="btn ghost" name="action" value="deactivate">Deactivate</button>
                    : <button className="btn ghost" name="action" value="activate">Activate</button>}
                </form>
                <form action={adminDeleteUser}>
                  <input type="hidden" name="id" value={u.id} />
                  <ConfirmButton className="btn danger" message={`Delete ${u.email}? Their account and ALL their orders will be erased. This can't be undone.`}>Delete</ConfirmButton>
                </form>
              </div>
            )}
          </div>
        );
      })}
      <small>Showing up to 100 users. Deactivate instead of delete if you want to keep order history.</small>
    </main>
  );
}
