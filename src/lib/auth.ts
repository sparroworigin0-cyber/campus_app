import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { effectiveRole, homeFor, type Role } from "./roles";

// Call at the top of every server component and server action. Middleware is only the first gate.
export async function requireRole(want: Role) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await sb.from("users").select("*").eq("id", user.id).single();
  const role = effectiveRole(me);
  if (!me || !role) redirect("/login");
  if (role !== want) redirect(homeFor(role));
  return { sb, me };
}
