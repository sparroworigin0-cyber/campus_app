"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

async function run(fn: string, args: Record<string, unknown>, back: string) {
  const { sb } = await requireRole("admin");
  const { error } = await sb.rpc(fn, args);
  revalidatePath("/admin", "layout");
  if (error) redirect(`${back}?error=${encodeURIComponent(error.message)}`);
}

export const adminCancelOrder = async (f: FormData) => run("admin_cancel_order", { p_order: s(f, "id") }, "/admin");
export const adminReleaseOrder = async (f: FormData) => run("admin_release_order", { p_order: s(f, "id") }, "/admin");
export const adminForceDeliver = async (f: FormData) => run("admin_force_deliver", { p_order: s(f, "id") }, "/admin");
export const adminSetFee = async (f: FormData) => run("admin_set_fee", { p_order: s(f, "id"), p_fee: Number(s(f, "fee")) }, "/admin");
export const adminUpdateUser = async (f: FormData) => run("admin_update_user", { p_user: s(f, "id"), p_action: s(f, "action") }, "/admin/users");
export const adminDeleteUser = async (f: FormData) => run("admin_delete_user", { p_user: s(f, "id") }, "/admin/users");
export const adminSetDefaultFee = async (f: FormData) => run("admin_set_default_fee", { p_fee: Number(s(f, "fee")) }, "/admin/settings");
