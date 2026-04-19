import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { VideoTile } from "@/components/VideoTile";
import { ControlsBar } from "@/components/ControlsBar";
import { StatusOverlay } from "@/components/StatusOverlay";
import { QualityBadge } from "@/components/QualityBadge";
import type { ChatStatus, Quality } from "@/hooks/useRandomChat";

interface ChatRoomProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  status: ChatStatus;
  quality: Quality;
  partnerInterests: string[];
  micEnabled: boolean;
  camEnabled: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onNext: () => void;
  onReport: () => void;
  onStop: () => void;
}

const STATUS_COPY: Record<ChatStatus, { title: string; subtitle?: string } | null> = {
  idle: null,
  permission: { title: "Waiting for camera…" },
  searching: { title: "Searching for a stranger…", subtitle: "Usually under 3 seconds" },
  connecting: { title: "Connecting…", subtitle: "Saying hi to your stranger" },
  connected: null,
  ended: { title: "Stranger disconnected", subtitle: "Finding someone new…" },
  error: { title: "Something went wrong", subtitle: "Try again from the home screen" },
};

const INACTIVITY_MS = 90_000;

export function ChatRoom(props: ChatRoomProps) {
  const {
    localStream,
    remoteStream,
    status,
    quality,
    partnerInterests,
    micEnabled,
    camEnabled,
    onToggleMic,
    onToggleCam,
    onNext,
    onReport,
    onStop,
  } = props;

  const lastActivityRef = useRef(Date.now());

  // Auto-disconnect on inactivity (no remote frames + no user action).
  useEffect(() => {
    const bump = () => (lastActivityRef.current = Date.now());
    window.addEventListener("pointermove", bump);
    window.addEventListener("keydown", bump);
    const id = window.setInterval(() => {
      if (status === "connected" && Date.now() - lastActivityRef.current > INACTIVITY_MS) {
        onNext();
        lastActivityRef.current = Date.now();
      }
    }, 5000);
    return () => {
      window.removeEventListener("pointermove", bump);
      window.removeEventListener("keydown", bump);
      window.clearInterval(id);
    };
  }, [status, onNext]);

  const overlay = STATUS_COPY[status];

  return (
    <div className="relative min-h-dvh w-full bg-background">
      {/* Stranger video — full bleed */}
      <div className="absolute inset-0">
        <VideoTile
          stream={remoteStream}
          className="!rounded-none h-full w-full border-0"
          label={
            partnerInterests.length
              ? `Stranger · ${partnerInterests.slice(0, 3).join(" · ")}`
              : "Stranger"
          }
          cornerBadge={status === "connected" ? <QualityBadge quality={quality} /> : null}
          placeholder={<span className="text-sm text-muted-foreground">No video yet</span>}
        />
      </div>

      {/* Status overlays */}
      <AnimatePresence>
        {overlay && (
          <StatusOverlay key={status} title={overlay.title} subtitle={overlay.subtitle} />
        )}
      </AnimatePresence>

      {/* Local PIP */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.05}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute right-4 top-4 z-20 h-32 w-24 cursor-grab overflow-hidden rounded-2xl border border-border/60 bg-secondary shadow-soft sm:right-6 sm:top-6 sm:h-44 sm:w-32 active:cursor-grabbing"
      >
        <VideoTile
          stream={localStream}
          muted
          mirrored
          className="!rounded-2xl h-full w-full border-0"
        />
        {!camEnabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 text-[10px] uppercase tracking-wider text-muted-foreground">
            Cam off
          </div>
        )}
      </motion.div>

      {/* Controls */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center pb-[max(env(safe-area-inset-bottom),1rem)]">
        <ControlsBar
          micEnabled={micEnabled}
          camEnabled={camEnabled}
          onToggleMic={onToggleMic}
          onToggleCam={onToggleCam}
          onNext={onNext}
          onReport={onReport}
          onStop={onStop}
          disabledNext={status === "searching"}
        />
      </div>
    </div>
  );
}
