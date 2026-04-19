import { useCallback, useEffect, useRef, useState } from "react";

export type MediaState = {
  stream: MediaStream | null;
  error: string | null;
  micEnabled: boolean;
  camEnabled: boolean;
  loading: boolean;
};

/**
 * Manages the local camera + mic stream.
 * - Lazy: only requests when `request()` is called.
 * - Stable: same MediaStream instance is reused across renders.
 */
export function useLocalMedia() {
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<MediaState>({
    stream: null,
    error: null,
    micEnabled: true,
    camEnabled: true,
    loading: false,
  });

  const request = useCallback(async () => {
    if (streamRef.current) return streamRef.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      setState((s) => ({ ...s, stream, loading: false }));
      return stream;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not access camera/mic.";
      setState((s) => ({ ...s, error: msg, loading: false }));
      throw e;
    }
  }, []);

  const toggleMic = useCallback(() => {
    const s = streamRef.current;
    if (!s) return;
    const next = !s.getAudioTracks().every((t) => t.enabled);
    s.getAudioTracks().forEach((t) => (t.enabled = next));
    setState((cur) => ({ ...cur, micEnabled: next }));
  }, []);

  const toggleCam = useCallback(() => {
    const s = streamRef.current;
    if (!s) return;
    const next = !s.getVideoTracks().every((t) => t.enabled);
    s.getVideoTracks().forEach((t) => (t.enabled = next));
    setState((cur) => ({ ...cur, camEnabled: next }));
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setState((s) => ({ ...s, stream: null }));
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { ...state, request, toggleMic, toggleCam, stop };
}
