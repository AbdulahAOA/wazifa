import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones = {
  ink: "bg-ink text-white",
  electric: "bg-electric text-ink",
  cobalt: "bg-cobalt text-white",
  coral: "bg-coral text-white",
  pale: "bg-pale text-ink",
} as const;

function Badge({
  className,
  tone = "ink",
  children,
}: {
  className?: string;
  tone?: keyof typeof tones;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center border-[2px] border-ink px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export { Badge };
