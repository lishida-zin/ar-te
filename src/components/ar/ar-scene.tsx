"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { createXRStore, XR } from "@react-three/xr";
import { HitIndicator } from "./hit-indicator";
import { PlacedBlocks } from "./placed-blocks";
import { AROverlay } from "./ar-overlay";
import { useARStore } from "@/store/ar-store";

function makeXRStore(overlayEl?: HTMLElement) {
  return createXRStore({
    offerSession: false,
    hitTest: "required",
    domOverlay: overlayEl,
  });
}

export function ArScene() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [inSession, setInSession] = useState(false);
  // Canvas 再マウント用キー（セッションごとにインクリメント）
  const [sessionKey, setSessionKey] = useState(0);
  const [xrStore, setXrStore] = useState(() => makeXRStore());

  const resetARState = useCallback(() => {
    useARStore.getState().clearAll();
    useARStore.setState({ hitPosition: null, mode: "place" });
  }, []);

  const handleEnterAR = useCallback(async () => {
    resetARState();

    // 新しい XR store を作成（前回セッションの内部状態を破棄）
    const newStore = makeXRStore(overlayRef.current ?? undefined);
    setXrStore(newStore);
    setSessionKey((k) => k + 1);

    // Canvas が新しい store で再マウントされるのを待つ
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    try {
      await newStore.enterAR();
      setInSession(true);
    } catch (err) {
      console.error("AR session failed:", err);
    }
  }, [resetARState]);

  const handleExitAR = useCallback(() => {
    const session = xrStore.getState().session;
    if (session) {
      session.end();
    }
    setInSession(false);
    resetARState();
  }, [xrStore, resetARState]);

  // ブラウザ側からセッション終了された場合を検知
  useEffect(() => {
    if (!inSession) return;

    const unsubscribe = xrStore.subscribe((state, prev) => {
      if (prev.session && !state.session) {
        setInSession(false);
        resetARState();
      }
    });

    return unsubscribe;
  }, [xrStore, inSession, resetARState]);

  return (
    <div className="relative h-dvh w-full">
      {/* AR Canvas — sessionKey で再マウントし WebXR フックをリセット */}
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

      {/* DOM Overlay (AR session 用) */}
      <div ref={overlayRef}>
        {inSession && <AROverlay onExit={handleExitAR} />}
      </div>

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
