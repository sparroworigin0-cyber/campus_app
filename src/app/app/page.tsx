import Link from "next/link";
import { requireRole } from "@/lib/auth";

export default async function CustomerHome() {
  const { me } = await requireRole("customer");
  return (
    <main className="wrap stack">
      <h1>Hi {me.full_name?.split(" ")[0] || "there"}, what do you need?</h1>
      <Link href="/app/orders/new" className="btn alt">Place order</Link>
      <Link href="/app/orders" className="btn">My orders</Link>
      <section className="card"><b>About us</b><p className="mute">Students on campus pick up what you need and bring it to your hostel. You name your price; an agent takes the job.</p></section>
      <section className="card"><b>Connect with us</b>
        <p><a href={`tel:${process.env.NEXT_PUBLIC_SUPPORT_PHONE}`}>{process.env.NEXT_PUBLIC_SUPPORT_PHONE}</a></p>
        <p><a href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`}>{process.env.NEXT_PUBLIC_SUPPORT_EMAIL}</a></p>
      </section>
    </main>
  );
}
