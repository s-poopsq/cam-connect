/**
 * Signaling entrypoint.
 *
 * Today: returns a MockSignaling backed by BroadcastChannel + localStorage.
 * Tomorrow: replace the body of `createSignaling()` with your Socket.io
 * adapter. The rest of the app does not need to change.
 *
 * Example future swap:
 *
 *   import { SocketIoSignaling } from "./SocketIoSignaling";
 *   export function createSignaling() {
 *     return new SocketIoSignaling(import.meta.env.VITE_SIGNALING_URL);
 *   }
 */

import { MockSignaling } from "./MockSignaling";
import type { SignalingAdapter } from "./types";

export function createSignaling(): SignalingAdapter {
  return new MockSignaling();
}

export type { SignalingAdapter } from "./types";
export * from "./types";
