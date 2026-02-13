"use client";

import { useRef, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { createXRStore, XR } from "@react-three/xr";
import { HitIndicator } from "./hit-indicator";
import { PlacedBlocks } from "./placed-blocks";
import { AROverlay } from "./ar-overlay";

export function ArScene() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [inSession, setInSession] = useState(false);
  const [xrStore] = useState(() =>
    createXRStore({
      offerSession: false,
      hitTest: "required",
      domOverlay: overlayRef.current ?? undefined,
    }),
  );

  const handleEnterAR = useCallback(async () => {
    // domOverlay の root を更新してからセッション開始
    if (overlayRef.current) {
      (xrStore as ReturnType<typeof createXRStore> & { domOverlay?: Element }).domOverlay =
        overlayRef.current;
    }
    try {
      await xrStore.enterAR();
      setInSession(true);
    } catch (err) {
      console.error("AR session failed:", err);
    }
  }, [xrStore]);

  const handleExitAR = useCallback(() => {
    const session = xrStore.getState().session;
    if (session) {
      session.end();
    }
    setInSession(false);
  }, [xrStore]);

  return (
    <div className="relative h-dvh w-full">
      {/* AR Canvas */}
      <Canvas
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
