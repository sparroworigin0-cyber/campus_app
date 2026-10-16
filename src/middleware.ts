import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { effectiveRole } from "@/lib/roles";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await sb.auth.getUser();
  let role = null;
  if (user) {
    const { data } = await sb.from("users").select("role,agent_status,is_active").eq("id", user.id).single();
    role = effectiveRole(data);
  }
  const go = (to: string) => NextResponse.redirect(new URL(to, req.url));
  const path = req.nextUrl.pathname;
  if (path.startsWith("/agent") && role !== "agent") return go(role === "customer" ? "/app" : "/login");
  if (path.startsWith("/app")) {
    if (!role) return go("/login");
    if (role === "agent") return go("/agent");
  }
  return res;
}

export const config = { matcher: ["/app/:path*", "/agent/:path*"] };
