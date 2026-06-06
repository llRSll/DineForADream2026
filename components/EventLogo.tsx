import Image from "next/image";
import { branding } from "@/lib/branding";

type Size = "sm" | "md" | "lg" | "xl";

type EventLogoProps = {
  size?: Size;
  showTagline?: boolean;
  showWordmark?: boolean;
  tone?: "light" | "dark";
  className?: string;
};

const MARK_RATIO = 301 / 329; // width / height of logo-mark.png

const sizeMap: Record<
  Size,
  { mark: number; title: string; tagline: string; gap: string }
> = {
  sm: { mark: 30, title: "text-base", tagline: "text-[9px]", gap: "gap-2.5" },
  md: { mark: 40, title: "text-xl", tagline: "text-[10px]", gap: "gap-3" },
  lg: { mark: 54, title: "text-2xl", tagline: "text-[11px]", gap: "gap-3.5" },
  xl: { mark: 74, title: "text-4xl", tagline: "text-xs", gap: "gap-4" },
};

const EventLogo = ({
  size = "md",
  showTagline = true,
  showWordmark = true,
  tone = "light",
  className = "",
}: EventLogoProps) => {
  const s = sizeMap[size];
  const isDark = tone === "dark";
  const markHeight = s.mark;
  const markWidth = Math.round(s.mark * MARK_RATIO);

  return (
    <div className={`flex items-center ${s.gap} ${className}`}>
      <Image
        src="/logo-mark.png"
        alt={`${branding.name} logo`}
        width={markWidth}
        height={markHeight}
        className="shrink-0"
        priority
      />
      {showWordmark ? (
        <div className="leading-none">
          <p
            className={`font-sans font-extrabold tracking-tight ${s.title} ${
              isDark ? "text-white" : "text-ink"
            }`}
          >
            {branding.name}
          </p>
          {showTagline ? (
            <p
              className={`mt-1.5 font-medium uppercase tracking-[0.18em] ${
                s.tagline
              } ${isDark ? "text-white/55" : "text-ink-faint"}`}
            >
              {branding.tagline}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default EventLogo;
