export type Role = "customer" | "agent";

// Only approved, active agents get the agent portal. Everyone else is a customer.
export function effectiveRole(u: { role: string; agent_status: string | null; is_active: boolean } | null): Role | null {
  if (!u || !u.is_active) return null;
  return u.role === "agent" && u.agent_status === "approved" ? "agent" : "customer";
}
