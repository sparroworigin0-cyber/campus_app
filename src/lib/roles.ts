export type Role = "customer" | "agent" | "admin";

// Admins get /admin, approved agents get /agent, everyone else active is a customer.
export function effectiveRole(u: { role: string; agent_status: string | null; is_active: boolean } | null): Role | null {
  if (!u || !u.is_active) return null;
  if (u.role === "admin") return "admin";
  return u.role === "agent" && u.agent_status === "approved" ? "agent" : "customer";
}

export const homeFor = (r: Role | null) => (r === "admin" ? "/admin" : r === "agent" ? "/agent" : r === "customer" ? "/app" : "/login");
