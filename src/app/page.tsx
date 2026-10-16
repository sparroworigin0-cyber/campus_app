import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { effectiveRole } from "@/lib/roles";

export default async function Home() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await sb.from("users").select("role,agent_status,is_active").eq("id", user.id).single();
  const role = effectiveRole(me);
  redirect(role === "agent" ? "/agent" : role ? "/app" : "/login");
}
