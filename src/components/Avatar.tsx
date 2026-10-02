"use client";

interface Props {
  name: string;
  theme?: string;
  size?: number;
}

export const AVATAR_THEMES: Record<string, string> = {
  aqua: "linear-gradient(135deg,#22d3ee,#3b82f6)",
  violet: "linear-gradient(135deg,#a78bfa,#6366f1)",
  sunset: "linear-gradient(135deg,#fb923c,#ef4444)",
  leaf: "linear-gradient(135deg,#34d399,#0ea5e9)",
  rose: "linear-gradient(135deg,#f472b6,#8b5cf6)",
  amber: "linear-gradient(135deg,#fbbf24,#f97316)",
};

export function avatarGradient(theme?: string): string {
  return AVATAR_THEMES[theme ?? "aqua"] ?? AVATAR_THEMES.aqua;
}

export default function Avatar({ name, theme, size = 40 }: Props) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: avatarGradient(theme),
        boxShadow: "0 6px 18px -6px rgba(37,140,248,0.7), inset 0 1px 0 rgba(255,255,255,0.4)",
      }}
      aria-hidden
    >
      {initials || "·"}
    </div>
  );
}
