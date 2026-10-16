import { requireRole } from "@/lib/auth";
import { sendFeedback } from "../actions";

export default async function Support({ searchParams }: { searchParams: { sent?: string } }) {
  await requireRole("customer");
  return (
    <main className="wrap stack">
      <h1>Contact and feedback</h1>
      {searchParams.sent && <p className="card" role="status">Thanks, we got your message.</p>}
      <form action={sendFeedback} className="stack">
        <textarea name="message" rows={5} placeholder="Tell us what went well or what went wrong" required maxLength={2000} />
        <button className="btn">Send feedback</button>
      </form>
      <section className="card stack">
        <a href={`tel:${process.env.NEXT_PUBLIC_SUPPORT_PHONE}`}>{process.env.NEXT_PUBLIC_SUPPORT_PHONE}</a>
        <a href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`}>{process.env.NEXT_PUBLIC_SUPPORT_EMAIL}</a>
      </section>
    </main>
  );
}
