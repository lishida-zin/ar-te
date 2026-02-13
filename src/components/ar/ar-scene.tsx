"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Canvas } from "@react-three/fiber";
import { createXRStore, XR } from "@react-three/xr";
import { HitIndicator } from "./hit-indicator";
import { PlacedBlocks } from "./placed-blocks";
import { AROverlay } from "./ar-overlay";
import { useARStore } from "@/store/ar-store";
import { useBlockStore } from "@/store/block-store";

export function ArScene() {
  const router = useRouter();
  const [inSession, setInSession] = useState(false);
  const [xrStore] = useState(() =>
    createXRStore({
      offerSession: false,
      hitTest: "required",
    }),
  );

  const resetARState = useCallback(() => {
    useARStore.getState().clearAll();
    useARStore.setState({ hitPosition: null, mode: "place" });
  }, []);

  const handleEnterAR = useCallback(async () => {
    resetARState();

    // 最初のブロックを自動選択（配置できない問題を防止）
    const blocks = useBlockStore.getState().blocks;
    if (blocks.length > 0) {
      useARStore.setState({ activeDefinitionId: blocks[0].id });
    }

    try {
      await xrStore.enterAR();
      setInSession(true);
    } catch (err) {
      console.error("AR session failed:", err);
      alert(
        "AR の起動に失敗しました: " +
          (err instanceof Error ? err.message : String(err)),
      );
    }
  }, [xrStore, resetARState]);

  // ← 戻る: セッション終了 + トップに遷移（コンポーネント完全破棄で確実にクリーンアップ）
  const handleExitAR = useCallback(() => {
    try {
      const session = xrStore.getState().session;
      if (session) {
        session.end();
      }
    } catch {
      // ignore
    }
    resetARState();
    router.push("/");
  }, [xrStore, resetARState, router]);

  // コンポーネント破棄時にセッション終了（ブラウザバック対応）
  useEffect(() => {
    return () => {
      try {
        const session = xrStore.getState().session;
        if (session) {
          session.end();
        }
      } catch {
        // ignore
      }
      resetARState();
    };
  }, [xrStore, resetARState]);

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

      {/* UI オーバーレイ（AROverlay 自体が fixed inset-0 で配置） */}
      {inSession && <AROverlay onExit={handleExitAR} />}

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
