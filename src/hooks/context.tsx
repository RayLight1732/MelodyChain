import { ReactNode, createContext, useContext, useEffect, useState } from "react";

export const reactAudioContext = createContext<AudioContext | null>(null);

export function AudioContextProvider({ children }: { children: ReactNode }) {
  const [audioContext] = useState(new AudioContext());
  useEffect(() => {
    const eventName = typeof document.ontouchend !== "undefined" ? "touchend" : "mouseup";
    document.addEventListener(eventName, initAudioContext);
    function initAudioContext() {
      document.removeEventListener(eventName, initAudioContext);
      // wake up AudioContext
      audioContext.resume();
      console.log("resume");
    }
    return () => {
      document.removeEventListener(eventName, initAudioContext);
    };
  });
  return <reactAudioContext.Provider value={audioContext}>{children}</reactAudioContext.Provider>;
}

export function useAudioContext(): AudioContext {
  return useContext(reactAudioContext)!;
}
