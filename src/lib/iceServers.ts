/**
 * ICE servers — public STUN by default. Add your own TURN here for users
 * behind strict NATs (Twilio, Metered, coturn, etc).
 *
 * For production we strongly recommend at least one TURN server, otherwise
 * ~10–20% of pairings will fail to connect.
 */
export const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  // Example TURN (uncomment + fill):
  // {
  //   urls: "turn:your.turn.server:3478",
  //   username: "user",
  //   credential: "pass",
  // },
];
