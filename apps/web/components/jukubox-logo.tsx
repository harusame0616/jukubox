import type { JSX } from "react";
import { cn } from "@/lib/utilities";

const sizeMap = {
  default: "text-xl",
  lg: "text-3xl",
  exlg: "text-7xl lg:text-8xl",
} as const;

type Size = keyof typeof sizeMap;

export function JukuBoxLogo({
  size = "default",
}: {
  size?: Size;
}): JSX.Element {
  return (
    <span
      className={cn(
        "font-orbitron text-primary font-black [text-shadow:0_0_18px_oklch(0.75_0.12_77/0.45)]",
        sizeMap[size],
      )}
    >
      JukuBox
    </span>
  );
}
