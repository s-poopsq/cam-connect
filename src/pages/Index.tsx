import { useCallback, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Landing } from "@/components/Landing";
import { ChatRoom } from "@/components/ChatRoom";
import { useLocalMedia } from "@/hooks/useLocalMedia";
import { useRandomChat } from "@/hooks/useRandomChat";

const Index = () => {
  const [interests, setInterests] = useState<string[]>([]);
  const [inRoom, setInRoom] = useState(false);

  const media = useLocalMedia();

  const chat = useRandomChat({
    localStream: media.stream,
    interests,
    onError: (msg) => toast({ title: "Connection error", description: msg, variant: "destructive" }),
  });

  const handleRequestMedia = useCallback(async () => {
    try {
      await media.request();
    } catch {
      toast({
        title: "Camera blocked",
        description: "Please allow camera and microphone access to continue.",
        variant: "destructive",
      });
    }
  }, [media]);

  const handleStart = useCallback(() => {
    setInRoom(true);
    chat.start();
  }, [chat]);

  const handleStop = useCallback(() => {
    chat.stop();
    setInRoom(false);
  }, [chat]);

  const handleReport = useCallback(() => {
    chat.report("user_report");
    toast({
      title: "Reported",
      description: "Thanks — finding you a new stranger.",
    });
    chat.next();
  }, [chat]);

  return (
    <>
      {/* SEO landmark */}
      <h1 className="sr-only">Pulse — Anonymous Random Video Chat</h1>

      {!inRoom ? (
        <Landing
          localStream={media.stream}
          loading={media.loading}
          error={media.error}
          interests={interests}
          setInterests={setInterests}
          onRequestMedia={handleRequestMedia}
          onStart={handleStart}
        />
      ) : (
        <ChatRoom
          localStream={media.stream}
          remoteStream={chat.remoteStream}
          status={chat.status}
          quality={chat.quality}
          partnerInterests={chat.partnerInterests}
          micEnabled={media.micEnabled}
          camEnabled={media.camEnabled}
          onToggleMic={media.toggleMic}
          onToggleCam={media.toggleCam}
          onNext={chat.next}
          onReport={handleReport}
          onStop={handleStop}
        />
      )}
    </>
  );
};

export default Index;
