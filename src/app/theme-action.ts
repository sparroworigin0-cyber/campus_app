"use server";
import { cookies } from "next/headers";
import { isTheme } from "@/lib/themes";

export async function setTheme(id: string) {
  if (!isTheme(id)) return;
  cookies().set("theme", id, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}
