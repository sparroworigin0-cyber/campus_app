export const DEFAULT_THEME = "neumorphic";
// sw = [background, accent] used for the picker swatch. Colours themselves live in globals.css.
export const THEMES = [
  { id: "neumorphic", name: "Soft Neumorphic", sw: ["#E0E5EC", "#00A896"] },
  { id: "cyber", name: "Cyber Tech", sw: ["#121212", "#00E5FF"] },
  { id: "obsidian", name: "Obsidian Stealth", sw: ["#000000", "#3B82F6"] },
  { id: "shadow", name: "Shadow Vault", sw: ["#000000", "#8B5CF6"] },
  { id: "abyss", name: "Abyss Zero", sw: ["#000000", "#FF2A5F"] },
  { id: "solarpunk", name: "Solarpunk", sw: ["#F7F9F5", "#1E3A2B"] },
  { id: "retrowave", name: "Retrowave", sw: ["#0D0221", "#FF007F"] },
  { id: "swiss", name: "Swiss Style", sw: ["#FFFFFF", "#FF3B30"] },
  { id: "tactical", name: "Industrial Tactical", sw: ["#121417", "#FF9F1C"] },
  { id: "gothic", name: "Dark Gothic", sw: ["#1A0C08", "#D4AF37"] },
  { id: "memphis", name: "Memphis Pop", sw: ["#FFEC00", "#FF60A8"] },
];
export const isTheme = (v?: string | null) => THEMES.some((t) => t.id === v);
