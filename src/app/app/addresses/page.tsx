import { requireRole } from "@/lib/auth";
import { addAddress, deleteAddress } from "../actions";

export default async function Addresses() {
  const { sb, me } = await requireRole("customer");
  const { data } = await sb.from("addresses").select("*").eq("user_id", me.id).is("deleted_at", null).order("created_at");
  return (
    <main className="wrap stack">
      <h1>Address book</h1>
      {(data ?? []).map((a: any) => (
        <div key={a.id} className="card stack">
          <div className="row"><b>{a.label}</b>{a.is_default && <span className="pill">Default</span>}</div>
          <span>{a.receiver_name}, {a.primary_phone}{a.alternate_phone ? `, ${a.alternate_phone}` : ""}</span>
          <span>{a.hostel}, room {a.room_number}</span>
          {a.call_instructions && <small>{a.call_instructions}</small>}
          <form action={deleteAddress}><input type="hidden" name="id" value={a.id} /><button className="btn ghost">Delete</button></form>
        </div>
      ))}
      <details className="card" open={!data?.length}>
        <summary><b>Add an address</b></summary>
        <form action={addAddress} className="stack" style={{ marginTop: 12 }}>
          <input name="label" placeholder="Label, e.g. Hostel or Library" />
          <input name="receiver_name" placeholder="Receiver name" required />
          <input name="primary_phone" placeholder="Phone number" inputMode="tel" required />
          <input name="alternate_phone" placeholder="Alternate phone (optional)" inputMode="tel" />
          <input name="hostel" placeholder="Hostel" required />
          <input name="room_number" placeholder="Room number" required />
          <textarea name="call_instructions" placeholder="What should the delivery agent do on arrival? e.g. call from the gate" rows={2} />
          <label><input type="checkbox" name="is_default" style={{ width: "auto" }} /> Make this my default address</label>
          <button className="btn">Save address</button>
        </form>
      </details>
    </main>
  );
}
