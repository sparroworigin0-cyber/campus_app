"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// RLS decides which order changes this user receives. On any event (or tab refocus) re-render the server page.
export default function Realtime({ channel }: { channel: string }) {
  const router = useRouter();
  useEffect(() => {
    const sb = createClient();
    const ch = sb.channel(channel).on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => router.refresh()).subscribe();
    const onVis = () => document.visibilityState === "visible" && router.refresh();
    document.addEventListener("visibilitychange", onVis);
    return () => { sb.removeChannel(ch); document.removeEventListener("visibilitychange", onVis); };
  }, [channel, router]);
  return null;
}
