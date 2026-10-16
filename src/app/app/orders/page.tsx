import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { STATUS_LABEL, TRACK_STEPS, UPCOMING } from "@/lib/orderMachine";
import Tracker from "@/components/Tracker";
import Fee from "@/components/Fee";
import { cancelOrder } from "../actions";

const PAGE = 10;

export default async function Orders({ searchParams }: { searchParams: { tab?: string; page?: string } }) {
  const { sb, me } = await requireRole("customer");
  const tab = searchParams.tab === "delivered" ? "delivered" : "upcoming";
  const page = Math.max(1, Number(searchParams.page) || 1);
  let q = sb.from("orders").select("*").eq("customer_id", me.id);
  q = tab === "delivered"
    ? q.eq("status", "DELIVERED")
    : q.in("status", UPCOMING).or(`status.neq.PENDING_ACCEPTANCE,expires_at.gt.${new Date().toISOString()}`);
  const { data } = await q.order("created_at", { ascending: false }).range((page - 1) * PAGE, page * PAGE);
  const rows = data ?? [];
  const href = (p: number) => `/app/orders?tab=${tab}&page=${p}`;

  return (
    <main className="wrap stack">
      <h1>My orders</h1>
      <div className="tabs">
        <Link href="/app/orders?tab=upcoming" className={tab === "upcoming" ? "on" : ""}>Upcoming</Link>
        <Link href="/app/orders?tab=delivered" className={tab === "delivered" ? "on" : ""}>Delivered</Link>
      </div>
      {!rows.length && <p className="mute">{tab === "upcoming" ? "No active orders. Place one from the home screen." : "Nothing delivered yet."}</p>}
      {rows.slice(0, PAGE).map((o: any) => {
        const ongoing = o.status === "PAYMENT_VERIFIED" || o.status === "OUT_FOR_DELIVERY";
        return (
          <details key={o.id} className="card" open={ongoing}>
            <summary>
              <img src={o.item_image_url} alt="" />
              <div>
                <b>{o.item_name}</b>
                <small>{o.public_code}</small>
                {ongoing && o.track_step > 0 && <small>Now: {TRACK_STEPS[o.track_step - 1]}</small>}
              </div>
              <span className="pill">{STATUS_LABEL[o.status]}</span>
            </summary>
            <div className="stack" style={{ marginTop: 12 }}>
              {o.item_description && <p>{o.item_description}</p>}
              <div className="row"><span>Your price</span><span className="amt">₹{o.proposed_price}</span></div>
              {o.final_price && Number(o.final_price) !== Number(o.proposed_price) && (
                <div className="row"><span>Agent's price</span><span className="amt">₹{o.final_price}</span></div>
              )}
              {o.price_change_reason && <small>Reason: {o.price_change_reason}</small>}
              <div className="row"><span>Delivery charge</span><Fee fee={o.delivery_fee} original={o.delivery_fee_original} /></div>
              {ongoing && <Tracker step={o.track_step} />}
              {o.status === "PENDING_ACCEPTANCE" && (
                <form action={cancelOrder}><input type="hidden" name="id" value={o.id} /><button className="btn ghost">Cancel request</button></form>
              )}
            </div>
          </details>
        );
      })}
      <div className="row">
        {page > 1 ? <Link href={href(page - 1)}>Newer</Link> : <span />}
        {rows.length > PAGE && <Link href={href(page + 1)}>Older</Link>}
      </div>
    </main>
  );
}
