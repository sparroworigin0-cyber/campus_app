import { requireRole } from "@/lib/auth";
import { NEXT_ACTION, STATUS_LABEL, TRACK_STEPS } from "@/lib/orderMachine";
import Tracker from "@/components/Tracker";
import Fee from "@/components/Fee";
import { advanceOrder, setDeliveryFee, setTrackStep } from "../actions";

export default async function Active({ searchParams }: { searchParams: { error?: string } }) {
  const { sb, me } = await requireRole("agent");
  const { data } = await sb.from("orders").select("*, order_delivery_details(*)")
    .eq("agent_id", me.id).in("status", ["AWAITING_PAYMENT", "PAYMENT_VERIFIED", "OUT_FOR_DELIVERY"])
    .order("claimed_at");
  return (
    <main className="wrap stack">
      <h1>My active orders</h1>
      {searchParams.error && <p className="err" role="alert">The charge can be lowered or kept, but not raised above the original.</p>}
      {!data?.length && <p className="mute">Nothing claimed. Pick an order from the feed.</p>}
      {data?.map((o: any) => {
        const d = Array.isArray(o.order_delivery_details) ? o.order_delivery_details[0] : o.order_delivery_details;
        const next = NEXT_ACTION[o.status];
        const moving = o.status !== "AWAITING_PAYMENT";
        return (
          <div key={o.id} className="card stack">
            <div className="row"><b>{o.item_name}</b><span className="pill">{STATUS_LABEL[o.status]}</span></div>
            <div className="row"><span>{o.public_code}</span><span className="amt">Item ₹{o.final_price}</span></div>
            {o.item_description && <p>{o.item_description}</p>}
            {d && (
              <div>
                <div>{d.receiver_name}: <a href={`tel:${d.primary_phone}`}>{d.primary_phone}</a></div>
                <div>{o.hostel}, room {d.room_number}</div>
                {d.call_instructions && <small>{d.call_instructions}</small>}
              </div>
            )}
            <div className="row"><span>Delivery charge</span><Fee fee={o.delivery_fee} original={o.delivery_fee_original} /></div>
            <form action={setDeliveryFee} className="row">
              <input type="hidden" name="id" value={o.id} />
              <input name="fee" type="number" min="0" max={o.delivery_fee_original} step="1" defaultValue={o.delivery_fee} aria-label="Delivery charge" />
              <button className="btn ghost">Set charge</button>
            </form>
            <small>Offers only: you can lower the charge from ₹{o.delivery_fee_original}, not raise it.</small>
            {moving && (
              <>
                <Tracker step={o.track_step} />
                <form action={setTrackStep} className="row">
                  <input type="hidden" name="id" value={o.id} />
                  {o.track_step > 0 && <button className="btn ghost" name="step" value={o.track_step - 1}>Undo</button>}
                  {o.track_step < 7 && <button className="btn" name="step" value={o.track_step + 1}>Mark: {TRACK_STEPS[o.track_step]}</button>}
                </form>
              </>
            )}
            {next && (
              <form action={advanceOrder}>
                <input type="hidden" name="id" value={o.id} /><input type="hidden" name="to" value={next.to} />
                <button className="btn alt">{next.label}</button>
              </form>
            )}
          </div>
        );
      })}
    </main>
  );
}
