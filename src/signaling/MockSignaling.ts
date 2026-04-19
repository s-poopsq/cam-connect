/**
 * MockSignaling
 * -------------
 * Frontend-only stand-in for a real signaling server.
 *
 * It uses a BroadcastChannel so two browser tabs on the same machine can
 * actually pair up over real WebRTC and have a working video call — perfect
 * for local testing without any backend.
 *
 * Replace this with a Socket.io-backed adapter when your server is ready.
 * Public API matches `SignalingAdapter` exactly.
 */

import type {
  MatchFoundEvent,
  QueuePreferences,
  SignalPayload,
  SignalingAdapter,
  SignalingEvents,
} from "./types";

type Listener<K extends keyof SignalingEvents> = SignalingEvents[K];

interface QueueEntry {
  peerId: string;
  interests: string[];
  ts: number;
}

interface BusMessage {
  kind: "queue:join" | "queue:leave" | "match" | "signal" | "leave";
  from: string;
  to?: string;
  pairId?: string;
  role?: "caller" | "callee";
  payload?: SignalPayload;
  entry?: QueueEntry;
}

const CHANNEL = "pulse-mock-signaling";
const QUEUE_KEY = "pulse:mock:queue";

function loadQueue(): QueueEntry[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as QueueEntry[];
    // GC stale (>30s) entries
    const fresh = arr.filter((e) => Date.now() - e.ts < 30_000);
    return fresh;
  } catch {
    return [];
  }
}

function saveQueue(q: QueueEntry[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

function scoreMatch(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const set = new Set(a.map((x) => x.toLowerCase()));
  return b.filter((x) => set.has(x.toLowerCase())).length;
}

export class MockSignaling implements SignalingAdapter {
  private channel: BroadcastChannel | null = null;
  private peerId: string;
  private partnerId: string | null = null;
  private pairId: string | null = null;
  private interests: string[] = [];
  private listeners: { [K in keyof SignalingEvents]?: Set<Listener<K>> } = {};
  private inQueue = false;

  constructor() {
    this.peerId = crypto.randomUUID();
  }

  async connect() {
    if (this.channel) return;
    this.channel = new BroadcastChannel(CHANNEL);
    this.channel.onmessage = (ev) => this.onBus(ev.data as BusMessage);
    this.emit("status", "idle");
  }

  disconnect() {
    this.leaveQueue();
    if (this.partnerId) this.bus({ kind: "leave", from: this.peerId, to: this.partnerId });
    this.partnerId = null;
    this.pairId = null;
    this.channel?.close();
    this.channel = null;
  }

  joinQueue(prefs: QueuePreferences) {
    this.interests = prefs.interests ?? [];
    this.inQueue = true;
    this.emit("status", "queued");

    // Try to find a waiting peer first
    const queue = loadQueue().filter((e) => e.peerId !== this.peerId);
    if (queue.length > 0) {
      // Pick best interest overlap, fallback to oldest
      const sorted = [...queue].sort((a, b) => {
        const sa = scoreMatch(this.interests, a.interests);
        const sb = scoreMatch(this.interests, b.interests);
        if (sa !== sb) return sb - sa;
        return a.ts - b.ts;
      });
      const partner = sorted[0];
      // Remove them from queue
      saveQueue(loadQueue().filter((e) => e.peerId !== partner.peerId));

      const pairId = crypto.randomUUID();
      this.partnerId = partner.peerId;
      this.pairId = pairId;
      this.inQueue = false;

      // Tell partner they got matched (they will be callee, we are caller)
      this.bus({
        kind: "match",
        from: this.peerId,
        to: partner.peerId,
        pairId,
        role: "callee",
      });

      this.emitMatched({
        pairId,
        role: "caller",
        partner: { interests: partner.interests },
      });
      return;
    }

    // Otherwise advertise ourselves
    const entry: QueueEntry = {
      peerId: this.peerId,
      interests: this.interests,
      ts: Date.now(),
    };
    saveQueue([...loadQueue().filter((e) => e.peerId !== this.peerId), entry]);
    this.bus({ kind: "queue:join", from: this.peerId, entry });
  }

  leaveQueue() {
    if (!this.inQueue) return;
    this.inQueue = false;
    saveQueue(loadQueue().filter((e) => e.peerId !== this.peerId));
    this.bus({ kind: "queue:leave", from: this.peerId });
    this.emit("status", "idle");
  }

  sendSignal(payload: SignalPayload) {
    if (!this.partnerId) return;
    this.bus({
      kind: "signal",
      from: this.peerId,
      to: this.partnerId,
      pairId: this.pairId ?? undefined,
      payload,
    });
  }

  next() {
    if (this.partnerId) {
      this.bus({ kind: "leave", from: this.peerId, to: this.partnerId });
    }
    this.partnerId = null;
    this.pairId = null;
    this.joinQueue({ interests: this.interests });
  }

  report(reason?: string) {
    // No backend — just log. Real adapter would POST to moderation endpoint.
    // eslint-disable-next-line no-console
    console.warn("[mock-signaling] report", { partnerId: this.partnerId, reason });
  }

  on<K extends keyof SignalingEvents>(event: K, handler: SignalingEvents[K]) {
    (this.listeners[event] ??= new Set() as Set<Listener<K>>).add(handler);
  }
  off<K extends keyof SignalingEvents>(event: K, handler: SignalingEvents[K]) {
    this.listeners[event]?.delete(handler);
  }

  // ---- internals ----

  private emit<K extends keyof SignalingEvents>(
    event: K,
    ...args: Parameters<SignalingEvents[K]>
  ) {
    this.listeners[event]?.forEach((h) => {
      // @ts-expect-error tuple spread to fn
      h(...args);
    });
  }

  private emitMatched(e: MatchFoundEvent) {
    this.emit("status", "matched");
    this.emit("matched", e);
  }

  private bus(msg: BusMessage) {
    this.channel?.postMessage(msg);
  }

  private onBus(msg: BusMessage) {
    if (msg.from === this.peerId) return;

    switch (msg.kind) {
      case "match": {
        if (msg.to !== this.peerId || !msg.pairId) return;
        this.partnerId = msg.from;
        this.pairId = msg.pairId;
        this.inQueue = false;
        saveQueue(loadQueue().filter((e) => e.peerId !== this.peerId));
        this.emitMatched({
          pairId: msg.pairId,
          role: msg.role ?? "callee",
        });
        break;
      }
      case "signal": {
        if (msg.to !== this.peerId || !msg.payload) return;
        this.emit("signal", msg.payload);
        break;
      }
      case "leave": {
        if (msg.to !== this.peerId) return;
        this.partnerId = null;
        this.pairId = null;
        this.emit("partnerLeft");
        break;
      }
      case "queue:leave": {
        // Another tab left the queue — nothing to do, queue store is the source of truth.
        break;
      }
      case "queue:join": {
        // Another tab is waiting. If we're queued too and arrived later, do nothing —
        // the joining tab will perform the matching. Avoids double-pair.
        break;
      }
    }
  }
}
