import Link from "next/link";
import { requireRole } from "@/lib/auth";
import Realtime from "@/components/Realtime";
import ThemePicker from "@/components/ThemePicker";
import { signOut } from "../login/actions";

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const { me } = await requireRole("agent");
  return (
    <div className="agent">
      <div className="mode">SPARROW · AGENT MODE</div>
      <div className="wrap" style={{ paddingBottom: 0 }}>
        <details className="card"><summary><b>Theme</b></summary><div style={{ marginTop: 10 }}><ThemePicker /></div></details>
      </div>
      {children}
      <nav className="tabbar">
        <Link href="/agent">Feed</Link>
        <Link href="/agent/active">Active</Link>
        <form action={signOut} style={{ flex: 1, display: "flex" }}><button>Log out</button></form>
      </nav>
      <Realtime channel={`agent-${me.id}`} />
    </div>
  );
}
