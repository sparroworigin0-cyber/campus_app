import { requireRole } from "@/lib/auth";
import { claimOrder } from "./actions";

const ERRORS: Record<string, string> = {
  ORDER_ALREADY_CLAIMED: "Another agent took that order.",
  PRICE_OUT_OF_BOUNDS: "Price must be within 30% of the customer's price.",
  REASON_REQUIRED: "Add a reason when you change the price.",
  FAILED: "Could not claim that order. Try again.",
};

export default async function Feed({ searchParams }: { searchParams: { error?: string } }) {
  const { sb } = await requireRole("agent");
  const { data } = await sb.from("orders")
    .select("id,public_code,item_name,item_description,item_image_url,proposed_price,hostel,created_at")
    .eq("status", "PENDING_ACCEPTANCE").gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
    const age = (t: string) => {
    const m = Math.max(0, Math.round((Date.now() - new Date(t).getTime()) / 60000));
    return m < 60 ? `${m}m` : m < 1440 ? `${Math.floor(m / 60)}h` : `${Math.floor(m / 1440)}d`;
  };
  return (
    <main className="wrap stack">
      <h1>Available orders ({data?.length ?? 0})</h1>
      {searchParams.error && <p className="err" role="alert">{ERRORS[searchParams.error] ?? ERRORS.FAILED}</p>}
      {!data?.length && <p className="mute">No open orders. New ones appear here live.</p>}
      {data?.map((o: any) => (
        <details key={o.id} className="card">
          <summary>
            <img className="thumb" src={o.item_image_url} alt="" />
            <div><b>{o.item_name}</b><small>{o.hostel}</small></div>
            <span className="amt">₹{o.proposed_price}</span>
            <small>{age(o.created_at)}</small>
          </summary>
          <form action={claimOrder} className="stack" style={{ marginTop: 10 }}>
            {o.item_description && <p>{o.item_description}</p>}
            <input type="hidden" name="id" value={o.id} />
            <div className="grid2">
              <input name="final_price" type="number" step="1" min="1" placeholder={`Final price (₹${o.proposed_price})`} />
              <input name="reason" placeholder="Reason, if price differs" />
            </div>
            <button className="btn">Claim order</button>
          </form>
        </details>
      ))}
    </main>
  );
}
