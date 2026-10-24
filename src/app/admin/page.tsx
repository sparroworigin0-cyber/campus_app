import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { STATUS_LABEL, TRACK_STEPS } from "@/lib/orderMachine";
import { adminError } from "@/lib/adminErrors";
import Fee from "@/components/Fee";
import ConfirmButton from "@/components/ConfirmButton";
import { adminCancelOrder, adminForceDeliver, adminReleaseOrder, adminSetFee } from "./actions";

const FILTERS: Record<string, { label: string; statuses: string[] | null }> = {
  all: { label: "All", statuses: null },
  pending: { label: "Pending", statuses: ["PENDING_ACCEPTANCE"] },
  active: { label: "Active", statuses: ["AWAITING_PAYMENT", "PAYMENT_VERIFIED", "OUT_FOR_DELIVERY", "DISPUTED"] },
  delivered: { label: "Delivered", statuses: ["DELIVERED"] },
  closed: { label: "Cancelled", statuses: ["CANCELLED", "EXPIRED"] },
};
const FINAL = ["DELIVERED", "CANCELLED", "EXPIRED"];

export default async function AdminOrders({ searchParams }: { searchParams: { f?: string; error?: string } }) {
  const { sb } = await requireRole("admin");
  const key = searchParams.f && FILTERS[searchParams.f] ? searchParams.f : "active";
  const statuses = FILTERS[key].statuses;

  let q = sb.from("orders")
    .select("*, customer:users!orders_customer_id_fkey(full_name,email,phone), agent:users!orders_agent_id_fkey(full_name,email,phone), order_delivery_details(*)")
    .order("created_at", { ascending: false }).limit(50);
  if (statuses) q = q.in("status", statuses);
  const { data } = await q;

  const counts = await Promise.all(Object.entries(FILTERS).map(async ([k, v]) => {
    let c = sb.from("orders").select("id", { count: "exact", head: true });
    if (v.statuses) c = c.in("status", v.statuses);
    return [k, (await c).count ?? 0] as const;
  }));
  const err = adminError(searchParams.error);

  return (
    <main className="wrap stack">
      <h1>Orders</h1>
      {err && <p className="err" role="alert">{err}</p>}
      <div className="tabs" style={{ flexWrap: "wrap" }}>
        {counts.map(([k, n]) => <Link key={k} href={`/admin?f=${k}`} className={k === key ? "on" : ""}>{FILTERS[k].label} ({n})</Link>)}
      </div>
      {!data?.length && <p className="mute">No orders here.</p>}
      {data?.map((o: any) => {
        const d = Array.isArray(o.order_delivery_details) ? o.order_delivery_details[0] : o.order_delivery_details;
        const final = FINAL.includes(o.status);
        return (
          <details key={o.id} className="card">
            <summary>
              <img className="thumb" src={o.item_image_url} alt="" />
              <div><b>{o.item_name}</b><small>{o.public_code} · {o.customer?.full_name || o.customer?.email}</small></div>
              <span className="pill">{STATUS_LABEL[o.status]}</span>
            </summary>
            <div className="stack" style={{ marginTop: 10 }}>
              {o.item_description && <p>{o.item_description}</p>}
              <div>Customer: {o.customer?.full_name} ({o.customer?.email}){d && <>, <a href={`tel:${d.primary_phone}`}>{d.primary_phone}</a></>}</div>
              {d && <div>Deliver to: {o.hostel}, room {d.room_number}{d.call_instructions ? ` (${d.call_instructions})` : ""}</div>}
              <div>Agent: {o.agent ? `${o.agent.full_name} (${o.agent.email})` : "not assigned"}</div>
              <div className="row"><span>Item price</span><span className="amt">₹{o.final_price ?? o.proposed_price}</span></div>
              <div className="row"><span>Delivery charge</span><Fee fee={o.delivery_fee} original={o.delivery_fee_original} /></div>
              {o.track_step > 0 && <small>Tracker: {TRACK_STEPS[o.track_step - 1]}</small>}
              {!final && (
                <>
                  <form action={adminSetFee} className="row">
                    <input type="hidden" name="id" value={o.id} />
                    <input name="fee" type="number" min="0" max="1000" step="1" defaultValue={o.delivery_fee} aria-label="Delivery charge" />
                    <button className="btn ghost">Set charge</button>
                  </form>
                  <div className="actions">
                    {o.agent_id && (
                      <form action={adminReleaseOrder}><input type="hidden" name="id" value={o.id} />
                        <ConfirmButton className="btn ghost" message="Take this order from its agent and put it back in the feed?">Release to feed</ConfirmButton></form>
                    )}
                    {(o.status === "PAYMENT_VERIFIED" || o.status === "OUT_FOR_DELIVERY") && (
                      <form action={adminForceDeliver}><input type="hidden" name="id" value={o.id} />
                        <ConfirmButton className="btn" message="Mark this order as delivered?">Mark delivered</ConfirmButton></form>
                    )}
                    <form action={adminCancelOrder}><input type="hidden" name="id" value={o.id} />
                      <ConfirmButton className="btn danger" message="Cancel this order? This can't be undone.">Cancel order</ConfirmButton></form>
                  </div>
                </>
              )}
            </div>
          </details>
        );
      })}
      <small>Showing the latest 50.</small>
    </main>
  );
}
