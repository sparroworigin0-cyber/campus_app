import { requireRole } from "@/lib/auth";
import Shell from "@/components/customer/Shell";
import Realtime from "@/components/Realtime";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { me } = await requireRole("customer");
  return (
    <div className="cust">
      <Shell name={me.full_name || me.email}>{children}</Shell>
      <Realtime channel={`customer-${me.id}`} />
    </div>
  );
}
