import "./globals.css";
import { cookies } from "next/headers";
import { Plus_Jakarta_Sans } from "next/font/google";
import { DEFAULT_THEME, isTheme } from "@/lib/themes";

const font = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font" });
export const metadata = { title: "Sparrow", description: "Campus delivery by students, for students" };

export default function Root({ children }: { children: React.ReactNode }) {
  const t = cookies().get("theme")?.value;
  return <html lang="en" className={font.variable} data-theme={isTheme(t) ? t : DEFAULT_THEME}><body>{children}</body></html>;
}
