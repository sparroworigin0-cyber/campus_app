"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { createOrder } from "../../actions";

export default function OrderForm({ userId, addresses }: { userId: string; addresses: any[] }) {
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024 || !/^image\/(jpeg|png|webp)$/.test(f.type)) { setErr("Use a JPG, PNG or WebP photo under 5 MB."); return; }
    setBusy(true); setErr("");
    const sb = createClient();
    const path = `${userId}/${crypto.randomUUID()}.${f.type.split("/")[1]}`;
    const { error } = await sb.storage.from("order-images").upload(path, f, { contentType: f.type });
    setBusy(false);
    if (error) { setErr("Photo upload failed. Try again."); return; }
    setImageUrl(sb.storage.from("order-images").getPublicUrl(path).data.publicUrl);
  }

  if (!addresses.length) return <p className="card">Add a delivery address first. <Link href="/app/addresses">Open address book</Link></p>;
  return (
    <form action={createOrder} className="stack">
      <label className="stack">Photo of the item
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} />
      </label>
      {imageUrl && <img src={imageUrl} alt="Item preview" className="card" style={{ maxHeight: 200, objectFit: "contain" }} />}
      {err && <p className="err" role="alert">{err}</p>}
      <input type="hidden" name="image_url" value={imageUrl} />
      <input name="name" placeholder="Product name" required maxLength={80} />
      <textarea name="desc" placeholder="Brand, size, quantity, which shop" rows={3} maxLength={500} />
      <label className="stack">Select price (₹)
        <input name="price" type="number" inputMode="decimal" min="1" max="50000" step="1" placeholder="What you want to pay for the item" required />
        <small>The agent may suggest a different price if the market price differs.</small>
      </label>
      <label className="stack">Deliver to
        <select name="address_id" defaultValue={addresses.find((a) => a.is_default)?.id}>
          {addresses.map((a) => <option key={a.id} value={a.id}>{a.label}: {a.hostel}, room {a.room_number}</option>)}
        </select>
      </label>
      <button className="btn alt" disabled={busy || !imageUrl}>{busy ? "Uploading photo…" : "Place order"}</button>
    </form>
  );
}
