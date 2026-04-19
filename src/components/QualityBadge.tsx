import { motion } from "framer-motion";
import type { Quality } from "@/hooks/useRandomChat";
import { cn } from "@/lib/utils";

const META: Record<Quality, { label: string; dot: string; ring: string; text: string }> = {
  unknown: { label: "—", dot: "bg-muted-foreground", ring: "ring-muted-foreground/30", text: "text-muted-foreground" },
  good: { label: "Good", dot: "bg-success", ring: "ring-success/30", text: "text-success" },
  fair: { label: "Fair", dot: "bg-warning", ring: "ring-warning/30", text: "text-warning" },
  poor: { label: "Poor", dot: "bg-destructive", ring: "ring-destructive/30", text: "text-destructive" },
};

export function QualityBadge({ quality }: { quality: Quality }) {
  const m = META[quality];
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 rounded-full bg-background/70 px-3 py-1 text-xs font-medium backdrop-blur border border-border/60"
    >
      <span className={cn("h-2 w-2 rounded-full ring-4", m.dot, m.ring)} />
      <span className={m.text}>{m.label}</span>
    </motion.div>
  );
}
