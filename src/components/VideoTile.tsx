import * as React from "react";
import { cn } from "@/lib/utils";

interface VideoTileProps extends React.HTMLAttributes<HTMLDivElement> {
  stream: MediaStream | null;
  muted?: boolean;
  mirrored?: boolean;
  label?: string;
  placeholder?: React.ReactNode;
  cornerBadge?: React.ReactNode;
}

/** Reusable <video> tile that binds a MediaStream and handles fallbacks. */
export const VideoTile = React.forwardRef<HTMLVideoElement, VideoTileProps>(
  ({ stream, muted, mirrored, label, placeholder, cornerBadge, className, ...rest }, ref) => {
    const innerRef = React.useRef<HTMLVideoElement | null>(null);

    React.useImperativeHandle(ref, () => innerRef.current as HTMLVideoElement);

    React.useEffect(() => {
      const v = innerRef.current;
      if (!v) return;
      if (v.srcObject !== stream) {
        v.srcObject = stream;
      }
    }, [stream]);

    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl bg-secondary/60 border border-border/60",
          className,
        )}
        {...rest}
      >
        {stream ? (
          <video
            ref={innerRef}
            autoPlay
            playsInline
            muted={muted}
            className={cn(
              "h-full w-full object-cover",
              mirrored && "scale-x-[-1]",
            )}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            {placeholder ?? "No video"}
          </div>
        )}

        {label && (
          <div className="absolute left-3 top-3 rounded-full bg-background/70 px-3 py-1 text-xs font-medium text-foreground/90 backdrop-blur">
            {label}
          </div>
        )}

        {cornerBadge && (
          <div className="absolute right-3 top-3">{cornerBadge}</div>
        )}
      </div>
    );
  },
);
VideoTile.displayName = "VideoTile";
