"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { createXRStore, XR } from "@react-three/xr";
import { HitIndicator } from "./hit-indicator";
import { PlacedBlocks } from "./placed-blocks";
import { AROverlay } from "./ar-overlay";
import { useARStore } from "@/store/ar-store";

function makeXRStore() {
  return createXRStore({
    offerSession: false,
    hitTest: "required",
    // domOverlay は使わない（React の DOM 管理と競合するため）
  });
}

export function ArScene() {
  const [inSession, setInSession] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const [xrStore, setXrStore] = useState(() => makeXRStore());
  const inSessionRef = useRef(false);

  const resetARState = useCallback(() => {
    useARStore.getState().clearAll();
    useARStore.setState({ hitPosition: null, mode: "place" });
  }, []);

  const handleEnterAR = useCallback(async () => {
    resetARState();

    const newStore = makeXRStore();
    const newKey = sessionKey + 1;
    setXrStore(newStore);
    setSessionKey(newKey);

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 300);
    });

    try {
      await newStore.enterAR();
      setInSession(true);
      inSessionRef.current = true;
    } catch (err) {
      console.error("AR session failed:", err);
      alert(
        "AR の起動に失敗しました: " +
          (err instanceof Error ? err.message : String(err)),
      );
    }
  }, [resetARState, sessionKey]);

  const handleExitAR = useCallback(() => {
    try {
      const session = xrStore.getState().session;
      if (session) {
        session.end();
      }
    } catch {
      // ignore
    }
    setInSession(false);
    inSessionRef.current = false;
    resetARState();
  }, [xrStore, resetARState]);

  // ブラウザ側からのセッション終了を検知
  useEffect(() => {
    if (!inSession) return;

    const intervalId = setInterval(() => {
      try {
        const state = xrStore.getState();
        if (!state.session && inSessionRef.current) {
          setInSession(false);
          inSessionRef.current = false;
          resetARState();
        }
      } catch {
        // ignore
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [xrStore, inSession, resetARState]);

  return (
    <div className="relative h-dvh w-full">
      {/* AR Canvas */}
      <Canvas
        key={sessionKey}
        className="!absolute inset-0"
        gl={{ alpha: true }}
        style={{ background: "transparent" }}
      >
        <XR store={xrStore}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[2, 4, 1]} intensity={1} />
          <HitIndicator />
          <PlacedBlocks />
        </XR>
      </Canvas>

      {/* UI オーバーレイ（DOM Overlay ではなく CSS position で重ねる） */}
      {inSession && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="pointer-events-auto">
            <AROverlay onExit={handleExitAR} />
          </div>
        </div>
      )}

      {/* AR未開始時のUI */}
      {!inSession && (
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <button
            onClick={handleEnterAR}
            className="rounded-2xl bg-white px-8 py-4 text-lg font-semibold text-black shadow-lg active:scale-95"
          >
            AR を開始
          </button>
        </div>
      )}
    </div>
  );
}
