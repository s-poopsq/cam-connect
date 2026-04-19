import { motion } from "framer-motion";
import { Camera, Mic, Sparkles, Zap, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoTile } from "@/components/VideoTile";
import { InterestPicker } from "@/components/InterestPicker";
import { cn } from "@/lib/utils";

interface LandingProps {
  localStream: MediaStream | null;
  loading: boolean;
  error: string | null;
  interests: string[];
  setInterests: (v: string[]) => void;
  onRequestMedia: () => void;
  onStart: () => void;
}

export function Landing({
  localStream,
  loading,
  error,
  interests,
  setInterests,
  onRequestMedia,
  onStart,
}: LandingProps) {
  const ready = !!localStream;

  return (
    <div className="relative min-h-dvh">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 grid-noise opacity-40" />
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/20 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 -z-10 h-[420px] w-[420px] rounded-full bg-primary-glow/10 blur-[120px]" />

      <header className="container flex items-center justify-between py-6">
        <a href="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
          <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </span>
          <span>Pulse</span>
        </a>
        <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Anonymous · End-to-end media
        </div>
      </header>

      <main className="container grid gap-10 pb-16 pt-4 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16 lg:pt-10">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-7"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/40 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            One click. One stranger. Live.
          </div>

          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Meet someone <span className="text-glow text-primary">new</span>,
            <br /> face to face.
          </h1>

          <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
            Pulse pairs you with a random person for a video call in seconds. No chat, no profile,
            no friction — just real human moments. Skip anytime.
          </p>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Interests</span>
              <span className="opacity-60">— optional. We'll prefer matches that overlap.</span>
            </div>
            <InterestPicker value={interests} onChange={setInterests} />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {!ready ? (
              <Button
                size="lg"
                onClick={onRequestMedia}
                disabled={loading}
                className="group h-14 rounded-full bg-gradient-primary px-8 text-base font-semibold text-primary-foreground shadow-glow hover:brightness-110"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Camera className="mr-2 h-5 w-5" />
                )}
                Enable camera & mic
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={onStart}
                className="group h-14 rounded-full bg-gradient-primary px-10 text-base font-semibold text-primary-foreground shadow-glow hover:brightness-110"
              >
                <Zap className="mr-2 h-5 w-5" />
                Start video chat
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              By starting, you agree to be respectful. Inappropriate behavior gets you banned.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="relative mx-auto w-full max-w-md"
        >
          {/* Pulse ring around preview */}
          <div className="relative aspect-square w-full">
            <div
              className={cn(
                "absolute inset-0 rounded-full",
                ready ? "animate-pulse-ring" : "",
              )}
            />
            <div className="absolute inset-0 rounded-full bg-gradient-primary opacity-25 blur-3xl" />
            <VideoTile
              stream={localStream}
              muted
              mirrored
              className="!rounded-full aspect-square h-full w-full glow-ring"
              placeholder={
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <div className="flex gap-2">
                    <Camera className="h-6 w-6" />
                    <Mic className="h-6 w-6" />
                  </div>
                  <p className="text-sm">Camera preview</p>
                </div>
              }
            />
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 text-center">
            {[
              { k: "<3s", v: "Match time" },
              { k: "P2P", v: "Direct video" },
              { k: "0", v: "Stored frames" },
            ].map((s) => (
              <div
                key={s.v}
                className="surface-card px-3 py-3"
              >
                <p className="font-display text-lg font-bold text-primary">{s.k}</p>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.v}</p>
              </div>
            ))}
          </div>
        </motion.section>
      </main>

      <footer className="container pb-8 text-center text-xs text-muted-foreground">
        Built for fun. Be kind.
      </footer>
    </div>
  );
}
