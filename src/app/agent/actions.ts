"use server";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const KNOWN = ["ORDER_ALREADY_CLAIMED", "PRICE_OUT_OF_BOUNDS", "REASON_REQUIRED"];

export async function claimOrder(f: FormData) {
  const { sb } = await requireRole("agent");
  const fp = s(f, "final_price");
  const { error } = await sb.rpc("claim_order", { p_order: s(f, "id"), p_final: fp ? Number(fp) : null, p_reason: s(f, "reason") || null });
  if (error) redirect(`/agent?error=${KNOWN.find((k) => error.message.includes(k)) ?? "FAILED"}`);
  redirect("/agent/active");
}

export async function advanceOrder(f: FormData) {
  const { sb } = await requireRole("agent");
  await sb.rpc("advance_order", { p_order: s(f, "id"), p_to: s(f, "to") });
  redirect("/agent/active");
}

export async function setTrackStep(f: FormData) {
  const { sb } = await requireRole("agent");
  await sb.rpc("set_track_step", { p_order: s(f, "id"), p_step: Number(s(f, "step")) });
  redirect("/agent/active");
}

export async function setDeliveryFee(f: FormData) {
  const { sb } = await requireRole("agent");
  const { error } = await sb.rpc("set_delivery_fee", { p_order: s(f, "id"), p_fee: Number(s(f, "fee")) });
  redirect(error ? "/agent/active?error=fee" : "/agent/active");
}
