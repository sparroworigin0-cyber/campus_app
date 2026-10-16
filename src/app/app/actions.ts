"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function createOrder(f: FormData) {
  const { sb, me } = await requireRole("customer");
  const price = Number(s(f, "price"));
  const img = s(f, "image_url");
  const ownImage = img.startsWith(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/order-images/${me.id}/`);
  if (!s(f, "name") || !(price > 0) || price > 50000 || !ownImage || !s(f, "address_id")) redirect("/app/orders/new?error=invalid");
  const { error } = await sb.rpc("create_order", {
    p_name: s(f, "name"), p_desc: s(f, "desc"), p_image: img, p_price: price, p_address_id: s(f, "address_id"),
  });
  if (error) redirect("/app/orders/new?error=failed");
  redirect("/app/orders");
}

export async function cancelOrder(f: FormData) {
  const { sb } = await requireRole("customer");
  await sb.rpc("cancel_order", { p_order: s(f, "id") });
  revalidatePath("/app/orders");
}

export async function updateProfile(f: FormData) {
  const { sb, me } = await requireRole("customer");
  await sb.from("users").update({
    full_name: s(f, "full_name"), phone: s(f, "phone"), enrollment_id: s(f, "enrollment_id") || null,
    hostel: s(f, "hostel"), room_number: s(f, "room_number"),
  }).eq("id", me.id);
  revalidatePath("/app", "layout");
}

export async function addAddress(f: FormData) {
  const { sb, me } = await requireRole("customer");
  const { count } = await sb.from("addresses").select("id", { count: "exact", head: true }).eq("user_id", me.id).is("deleted_at", null);
  const makeDefault = f.get("is_default") === "on" || !count;
  if (makeDefault) await sb.from("addresses").update({ is_default: false }).eq("user_id", me.id);
  await sb.from("addresses").insert({
    user_id: me.id, label: s(f, "label") || "Hostel", receiver_name: s(f, "receiver_name"),
    primary_phone: s(f, "primary_phone"), alternate_phone: s(f, "alternate_phone") || null,
    hostel: s(f, "hostel"), room_number: s(f, "room_number"), call_instructions: s(f, "call_instructions") || null,
    is_default: makeDefault,
  });
  revalidatePath("/app/addresses");
}

export async function deleteAddress(f: FormData) {
  const { sb, me } = await requireRole("customer");
  await sb.from("addresses").update({ deleted_at: new Date().toISOString(), is_default: false }).eq("id", s(f, "id")).eq("user_id", me.id);
  revalidatePath("/app/addresses");
}

export async function sendFeedback(f: FormData) {
  const { sb, me } = await requireRole("customer");
  const message = s(f, "message");
  if (message) await sb.from("feedback").insert({ user_id: me.id, message });
  redirect("/app/support?sent=1");
}
