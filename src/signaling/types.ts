/**
 * Signaling adapter interface.
 *
 * The whole app talks WebRTC through this contract. Swap the implementation
 * (mock <-> Socket.io <-> Lovable Cloud Realtime) without touching the UI.
 *
 * Wire your own Socket.io backend later by implementing `SignalingAdapter`
 * and exporting it from `signaling/index.ts`.
 */

export type MatchRole = "caller" | "callee";

export interface MatchFoundEvent {
  /** Stable id for this peer pairing — used as the "room". */
  pairId: string;
  /** Who creates the SDP offer. */
  role: MatchRole;
  /** Optional partner metadata (interests, etc.) */
  partner?: { interests?: string[] };
}

export type SignalPayload =
  | { type: "offer"; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; sdp: RTCSessionDescriptionInit }
  | { type: "ice"; candidate: RTCIceCandidateInit };

export interface QueuePreferences {
  interests?: string[];
}

export interface SignalingEvents {
  /** Server has paired you with someone. */
  matched: (e: MatchFoundEvent) => void;
  /** Inbound signaling message from the partner. */
  signal: (payload: SignalPayload) => void;
  /** Partner left or was disconnected. */
  partnerLeft: () => void;
  /** Connection / queue status. */
  status: (s: "idle" | "connecting" | "queued" | "matched" | "error") => void;
}

export interface SignalingAdapter {
  connect(): Promise<void>;
  disconnect(): void;

  joinQueue(prefs: QueuePreferences): void;
  leaveQueue(): void;

  /** Send a signaling message to the currently matched partner. */
  sendSignal(payload: SignalPayload): void;

  /** Tell server we want a new partner (skip current). */
  next(): void;

  /** Report current partner. Server-side moderation hook. */
  report(reason?: string): void;

  on<K extends keyof SignalingEvents>(event: K, handler: SignalingEvents[K]): void;
  off<K extends keyof SignalingEvents>(event: K, handler: SignalingEvents[K]): void;
}
