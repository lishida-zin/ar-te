"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { createXRStore, XR } from "@react-three/xr";
import { HitIndicator } from "./hit-indicator";
import { PlacedBlocks } from "./placed-blocks";
import { AROverlay } from "./ar-overlay";
import { useARStore } from "@/store/ar-store";

export function ArScene() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [inSession, setInSession] = useState(false);
  // セッションごとに XR store を再生成するためのキー
  const [sessionKey, setSessionKey] = useState(0);
  const xrStoreRef = useRef<ReturnType<typeof createXRStore> | null>(null);

  // セッション開始時に新しい XR store を作成
  const handleEnterAR = useCallback(async () => {
    // AR状態をリセット
    useARStore.getState().clearAll();
    useARStore.setState({ hitPosition: null, mode: "place" });

    // DOM overlay root を取得
    const overlayRoot = overlayRef.current ?? undefined;

    // 新しい XR store を作成（セッションごとに新規）
    const store = createXRStore({
      offerSession: false,
      hitTest: "required",
      domOverlay: overlayRoot,
    });
    xrStoreRef.current = store;
    setSessionKey((k) => k + 1);

    try {
      // 少し待ってから enterAR（Canvas の再マウントを待つ）
      await new Promise((r) => setTimeout(r, 100));
      await store.enterAR();
      setInSession(true);
    } catch (err) {
      console.error("AR session failed:", err);
    }
  }, []);

  const handleExitAR = useCallback(() => {
    const store = xrStoreRef.current;
    if (store) {
      const session = store.getState().session;
      if (session) {
        session.end();
      }
    }
    setInSession(false);
    // AR状態をリセット
    useARStore.getState().clearAll();
    useARStore.setState({ hitPosition: null, mode: "place" });
  }, []);

  // セッション終了を検知（ブラウザ側から終了された場合）
  useEffect(() => {
    const store = xrStoreRef.current;
    if (!store || !inSession) return;

    const unsubscribe = store.subscribe((state) => {
      if (!state.session && inSession) {
        setInSession(false);
        useARStore.getState().clearAll();
        useARStore.setState({ hitPosition: null, mode: "place" });
      }
    });

    return unsubscribe;
  }, [inSession, sessionKey]);

  return (
    <div className="relative h-dvh w-full">
      {/* AR Canvas — sessionKey でセッションごとに再マウント */}
      {xrStoreRef.current && (
        <Canvas
          key={sessionKey}
          className="!absolute inset-0"
          gl={{ alpha: true }}
          style={{ background: "transparent" }}
        >
          <XR store={xrStoreRef.current}>
            <ambientLight intensity={0.8} />
            <directionalLight position={[2, 4, 1]} intensity={1} />
            <HitIndicator />
            <PlacedBlocks />
          </XR>
        </Canvas>
      )}

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
