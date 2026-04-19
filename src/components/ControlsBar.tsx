import { Mic, MicOff, Video, VideoOff, SkipForward, Flag, Power } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ControlsBarProps {
  micEnabled: boolean;
  camEnabled: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onNext: () => void;
  onReport: () => void;
  onStop: () => void;
  disabledNext?: boolean;
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  variant?: "default" | "primary" | "danger";
  label: string;
}

function CtrlBtn({ active, variant = "default", label, className, children, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "group relative inline-flex h-12 w-12 items-center justify-center rounded-full border transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        variant === "default" && "border-border/60 bg-secondary/70 text-foreground hover:bg-secondary",
        variant === "primary" &&
          "border-primary/40 bg-primary text-primary-foreground hover:brightness-110 shadow-glow",
        variant === "danger" &&
          "border-destructive/50 bg-destructive/15 text-destructive hover:bg-destructive/25",
        active === false && "bg-destructive/15 text-destructive border-destructive/40",
        "sm:h-14 sm:w-14",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ControlsBar({
  micEnabled,
  camEnabled,
  onToggleMic,
  onToggleCam,
  onNext,
  onReport,
  onStop,
  disabledNext,
}: ControlsBarProps) {
  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-auto mx-auto flex items-center gap-2 rounded-full border border-border/60 bg-background/70 p-2 backdrop-blur-xl shadow-soft sm:gap-3 sm:p-3"
    >
      <CtrlBtn label={micEnabled ? "Mute mic" : "Unmute mic"} active={micEnabled} onClick={onToggleMic}>
        {micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </CtrlBtn>
      <CtrlBtn label={camEnabled ? "Turn camera off" : "Turn camera on"} active={camEnabled} onClick={onToggleCam}>
        {camEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </CtrlBtn>

      <div className="mx-1 hidden h-8 w-px bg-border/60 sm:block" />

      <CtrlBtn
        label="Next stranger"
        variant="primary"
        onClick={onNext}
        disabled={disabledNext}
        className="w-auto px-5 sm:w-auto sm:px-6"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <SkipForward className="h-5 w-5" />
          <span className="hidden sm:inline">Next</span>
        </span>
      </CtrlBtn>

      <div className="mx-1 hidden h-8 w-px bg-border/60 sm:block" />

      <CtrlBtn label="Report" variant="danger" onClick={onReport}>
        <Flag className="h-5 w-5" />
      </CtrlBtn>
      <CtrlBtn label="Leave" onClick={onStop}>
        <Power className="h-5 w-5" />
      </CtrlBtn>
    </motion.div>
  );
}
