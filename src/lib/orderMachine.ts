// UI-side view of the order lifecycle. The authoritative transitions live in supabase/*.sql.
const PAYMENTS = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";

export const STATUS_LABEL: Record<string, string> = {
  PENDING_ACCEPTANCE: "Waiting for an agent",
  AWAITING_PAYMENT: "Payment requested",
  PAYMENT_VERIFIED: PAYMENTS ? "Payment verified" : "Accepted",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
  DISPUTED: "In dispute",
};
export const UPCOMING = ["PENDING_ACCEPTANCE", "AWAITING_PAYMENT", "PAYMENT_VERIFIED", "OUT_FOR_DELIVERY"];
// Handover is the only manual status button now; moving the tracker flips Accepted -> Out for delivery.
export const NEXT_ACTION: Record<string, { to: string; label: string }> = {
  OUT_FOR_DELIVERY: { to: "DELIVERED", label: "Mark delivered" },
};
export const TRACK_STEPS = [
  "Left IIT", "Arrived at bus stop", "Arrived at shop", "Product bought",
  "Back at bus stop", "Arrived at IIT", "Delivery incoming",
];
