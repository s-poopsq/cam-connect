import { motion } from "framer-motion";

export function StatusOverlay({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-background/40 backdrop-blur-md"
    >
      <div className="relative">
        <div className="h-20 w-20 rounded-full border border-primary/40 animate-pulse-ring" />
        <div className="absolute inset-0 m-auto h-12 w-12 rounded-full bg-gradient-primary glow-primary" />
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold tracking-tight text-foreground">{title}</p>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </motion.div>
  );
}
