"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const fail = (m: string, mode = "") => redirect(`/login?${mode ? "mode=signup&" : ""}error=${encodeURIComponent(m)}`);

export async function signIn(f: FormData) {
  const { error } = await createClient().auth.signInWithPassword({ email: s(f, "email"), password: s(f, "password") });
  if (error) fail("Wrong email or password.");
  redirect("/");
}

export async function signUp(f: FormData) {
  const { error } = await createClient().auth.signUp({
    email: s(f, "email"), password: s(f, "password"), options: { data: { full_name: s(f, "full_name") } },
  });
  if (error) fail(error.message, "signup");
  redirect("/");
}

export async function signOut() {
  await createClient().auth.signOut();
  redirect("/login");
}
