"use client";
import Link from "next/link";
import { useState } from "react";
import { signOut } from "@/app/login/actions";
import ThemePicker from "@/components/ThemePicker";

const links = [
  ["/app/profile", "Personal details"], ["/app/addresses", "Address book"],
  ["/app/orders", "My orders"], ["/app/support", "Contact and feedback"],
];

export default function Shell({ name, children }: { name: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="bar">
        <button className="icon" aria-label="Open menu" onClick={() => setOpen(true)}>☰</button>
        <Link href="/app" className="logo">Sparrow</Link>
        <span className="chip"><i>{name[0]?.toUpperCase() ?? "?"}</i>{name.split(" ")[0]}</span>
      </header>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <nav className={"drawer" + (open ? " open" : "")} aria-hidden={!open}>
        <b>{name}</b>
        {links.map(([href, label]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
        <section className="themebox"><b>Theme</b><ThemePicker /></section>
        <form action={signOut}><button className="btn ghost">Log out</button></form>
      </nav>
      {children}
    </>
  );
}
