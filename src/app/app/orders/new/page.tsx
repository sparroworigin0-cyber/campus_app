import { requireRole } from "@/lib/auth";
import OrderForm from "./OrderForm";

export default async function NewOrder({ searchParams }: { searchParams: { error?: string } }) {
  const { sb, me } = await requireRole("customer");
  const { data: addresses } = await sb.from("addresses").select("*").eq("user_id", me.id).is("deleted_at", null).order("created_at");
  return (
    <main className="wrap stack">
      <h1>Place order</h1>
      {searchParams.error && <p className="err" role="alert">Check the photo, name, price and address, then try again.</p>}
      <OrderForm userId={me.id} addresses={addresses ?? []} />
    </main>
  );
}
