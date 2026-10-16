"use client";
import { useEffect, useState, useTransition } from "react";
import { THEMES, DEFAULT_THEME } from "@/lib/themes";
import { setTheme } from "@/app/theme-action";

export default function ThemePicker() {
  const [current, setCurrent] = useState(DEFAULT_THEME);
  const [, start] = useTransition();
  useEffect(() => setCurrent(document.documentElement.dataset.theme || DEFAULT_THEME), []);

  function pick(id: string) {
    document.documentElement.dataset.theme = id; // instant, no flash
    setCurrent(id);
    start(() => { setTheme(id); });
  }
  return (
    <div className="stack">
      <div className="themes" role="group" aria-label="Theme">
        {THEMES.map((t) => (
          <button key={t.id} type="button" title={t.name} aria-label={t.name} aria-pressed={current === t.id}
            style={{ background: `linear-gradient(135deg, ${t.sw[0]} 50%, ${t.sw[1]} 50%)` }} onClick={() => pick(t.id)} />
        ))}
      </div>
      <small>{THEMES.find((t) => t.id === current)?.name}</small>
    </div>
  );
}
