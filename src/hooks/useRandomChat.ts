import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ICE_SERVERS } from "@/lib/iceServers";
import {
  createSignaling,
  type MatchFoundEvent,
  type SignalPayload,
  type SignalingAdapter,
} from "@/signaling";

export type ChatStatus =
  | "idle"
  | "permission"
  | "searching"
  | "connecting"
  | "connected"
  | "ended"
  | "error";

export type Quality = "unknown" | "good" | "fair" | "poor";

interface UseRandomChatArgs {
  localStream: MediaStream | null;
  interests: string[];
  onError?: (e: string) => void;
}

/**
 * Glue between signaling adapter, RTCPeerConnection, and React state.
 *
 * State machine (high level):
 *   idle -> searching -> connecting -> connected -> (next|partnerLeft) -> searching
 */
export function useRandomChat({ localStream, interests, onError }: UseRandomChatArgs) {
  const signalingRef = useRef<SignalingAdapter | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const statsTimerRef = useRef<number | null>(null);

  const [status, setStatus] = useState<ChatStatus>("idle");
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [partnerInterests, setPartnerInterests] = useState<string[]>([]);
  const [quality, setQuality] = useState<Quality>("unknown");

  // Lazily create signaling once.
  const signaling = useMemo(() => {
    const s = createSignaling();
    signalingRef.current = s;
    return s;
  }, []);

  // ---- WebRTC plumbing -------------------------------------------------

  const teardownPeer = useCallback(() => {
    if (statsTimerRef.current) {
      window.clearInterval(statsTimerRef.current);
      statsTimerRef.current = null;
    }
    pcRef.current?.getSenders().forEach((s) => {
      try {
        s.track?.stop;
      } catch {
        /* noop */
      }
    });
    try {
      pcRef.current?.close();
    } catch {
      /* noop */
    }
    pcRef.current = null;
    remoteStreamRef.current = null;
    pendingIceRef.current = [];
    setRemoteStream(null);
    setQuality("unknown");
  }, []);

  const startQualityMonitor = useCallback(() => {
    if (statsTimerRef.current) window.clearInterval(statsTimerRef.current);
    let lastBytes = 0;
    let lastTs = 0;
    statsTimerRef.current = window.setInterval(async () => {
      const pc = pcRef.current;
      if (!pc) return;
      try {
        const stats = await pc.getStats();
        let rtt = 0;
        let lossRatio = 0;
        let bytes = 0;
        let ts = 0;
        stats.forEach((r) => {
          if (r.type === "candidate-pair" && (r as RTCIceCandidatePairStats).nominated) {
            rtt = (r as RTCIceCandidatePairStats).currentRoundTripTime ?? 0;
          }
          if (r.type === "inbound-rtp" && (r as RTCInboundRtpStreamStats).kind === "video") {
            const ir = r as RTCInboundRtpStreamStats & {
              packetsLost?: number;
              packetsReceived?: number;
              bytesReceived?: number;
              timestamp?: number;
            };
            const lost = ir.packetsLost ?? 0;
            const recv = ir.packetsReceived ?? 1;
            lossRatio = lost / Math.max(1, lost + recv);
            bytes = ir.bytesReceived ?? 0;
            ts = ir.timestamp ?? 0;
          }
        });
        let bitrateKbps = 0;
        if (lastTs && ts > lastTs) {
          bitrateKbps = ((bytes - lastBytes) * 8) / (ts - lastTs); // bytes->bits / ms = kbps
        }
        lastBytes = bytes;
        lastTs = ts;

        let q: Quality = "good";
        if (rtt > 0.4 || lossRatio > 0.08 || (bitrateKbps > 0 && bitrateKbps < 150)) q = "poor";
        else if (rtt > 0.2 || lossRatio > 0.03 || (bitrateKbps > 0 && bitrateKbps < 400)) q = "fair";
        setQuality(q);
      } catch {
        /* ignore */
      }
    }, 2000);
  }, []);

  const createPeer = useCallback(
    (role: "caller" | "callee") => {
      teardownPeer();
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;

      const remote = new MediaStream();
      remoteStreamRef.current = remote;
      setRemoteStream(remote);

      // Push our local tracks
      if (localStream) {
        localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
      }

      pc.ontrack = (ev) => {
        ev.streams[0]?.getTracks().forEach((t) => remote.addTrack(t));
      };

      pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          signaling.sendSignal({ type: "ice", candidate: ev.candidate.toJSON() });
        }
      };

      pc.onconnectionstatechange = () => {
        const s = pc.connectionState;
        if (s === "connected") {
          setStatus("connected");
          startQualityMonitor();
        } else if (s === "failed" || s === "closed") {
          setStatus("ended");
        } else if (s === "disconnected") {
          setQuality("poor");
        }
      };

      // Caller creates the offer
      if (role === "caller") {
        (async () => {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            signaling.sendSignal({ type: "offer", sdp: offer });
          } catch (e) {
            onError?.(e instanceof Error ? e.message : "Failed to create offer");
            setStatus("error");
          }
        })();
      }

      return pc;
    },
    [localStream, signaling, startQualityMonitor, teardownPeer, onError],
  );

  // ---- Signaling event handlers ---------------------------------------

  useEffect(() => {
    const onMatched = (e: MatchFoundEvent) => {
      setPartnerInterests(e.partner?.interests ?? []);
      setStatus("connecting");
      createPeer(e.role);
    };

    const onSignal = async (payload: SignalPayload) => {
      const pc = pcRef.current;
      if (!pc) return;
      try {
        if (payload.type === "offer") {
          await pc.setRemoteDescription(payload.sdp);
          // Drain queued ICE
          for (const c of pendingIceRef.current) await pc.addIceCandidate(c);
          pendingIceRef.current = [];
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          signaling.sendSignal({ type: "answer", sdp: answer });
        } else if (payload.type === "answer") {
          await pc.setRemoteDescription(payload.sdp);
          for (const c of pendingIceRef.current) await pc.addIceCandidate(c);
          pendingIceRef.current = [];
        } else if (payload.type === "ice") {
          if (pc.remoteDescription) {
            await pc.addIceCandidate(payload.candidate);
          } else {
            pendingIceRef.current.push(payload.candidate);
          }
        }
      } catch (e) {
        onError?.(e instanceof Error ? e.message : "Signaling error");
      }
    };

    const onLeft = () => {
      teardownPeer();
      // Auto re-queue: feels seamless.
      setStatus("searching");
      signaling.joinQueue({ interests });
    };

    signaling.on("matched", onMatched);
    signaling.on("signal", onSignal);
    signaling.on("partnerLeft", onLeft);

    void signaling.connect();

    return () => {
      signaling.off("matched", onMatched);
      signaling.off("signal", onSignal);
      signaling.off("partnerLeft", onLeft);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signaling, createPeer, teardownPeer]);

  // ---- Public API ------------------------------------------------------

  const start = useCallback(() => {
    if (!localStream) return;
    setStatus("searching");
    signaling.joinQueue({ interests });
  }, [signaling, interests, localStream]);

  const next = useCallback(() => {
    teardownPeer();
    setStatus("searching");
    signaling.next();
  }, [signaling, teardownPeer]);

  const stop = useCallback(() => {
    teardownPeer();
    signaling.leaveQueue();
    setStatus("idle");
  }, [signaling, teardownPeer]);

  const report = useCallback(
    (reason?: string) => {
      signaling.report(reason);
    },
    [signaling],
  );

  useEffect(() => {
    return () => {
      teardownPeer();
      signaling.disconnect();
    };
  }, [signaling, teardownPeer]);

  return {
    status,
    remoteStream,
    quality,
    partnerInterests,
    start,
    next,
    stop,
    report,
  };
}
