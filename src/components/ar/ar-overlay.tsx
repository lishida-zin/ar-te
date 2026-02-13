"use client";

import { useCallback, useRef } from "react";
import { useARStore } from "@/store/ar-store";
import { useBlockStore } from "@/store/block-store";
import { computePinchScale, computeRotationDelta } from "@/lib/gestures";
import type { ARMode } from "@/types";

const MODE_LABELS: Record<ARMode, string> = {
  place: "配置",
  move: "移動",
  scale: "拡縮",
  rotate: "回転",
};

interface AROverlayProps {
  onExit: () => void;
}

export function AROverlay({ onExit }: AROverlayProps) {
  const mode = useARStore((s) => s.mode);
  const setMode = useARStore((s) => s.setMode);
  const activeDefinitionId = useARStore((s) => s.activeDefinitionId);
  const setActiveDefinition = useARStore((s) => s.setActiveDefinition);
  const selectedPlacedId = useARStore((s) => s.selectedPlacedId);
  const deletePlaced = useARStore((s) => s.deletePlaced);
  const placeBlock = useARStore((s) => s.placeBlock);
  const updatePlaced = useARStore((s) => s.updatePlaced);
  const blocks = useBlockStore((s) => s.blocks);

  const prevTouchesRef = useRef<
    [{ clientX: number; clientY: number }, { clientX: number; clientY: number }] | null
  >(null);

  const handleDelete = useCallback(() => {
    if (selectedPlacedId) {
      deletePlaced(selectedPlacedId);
    }
  }, [selectedPlacedId, deletePlaced]);

  // 画面中央タッチエリアのタッチ処理
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1 && mode === "place") {
        // 配置モード: タップでブロック配置
        if (!activeDefinitionId) return;
        const hitPosition = useARStore.getState().hitPosition;
        if (hitPosition) {
          placeBlock(activeDefinitionId, hitPosition);
        }
      }
      if (e.touches.length === 2) {
        const a = e.touches[0];
        const b = e.touches[1];
        prevTouchesRef.current = [
          { clientX: a.clientX, clientY: a.clientY },
          { clientX: b.clientX, clientY: b.clientY },
        ];
      }
    },
    [mode, activeDefinitionId, placeBlock],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 2 || !prevTouchesRef.current || !selectedPlacedId)
        return;

      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const curr: [{ clientX: number; clientY: number }, { clientX: number; clientY: number }] = [
        { clientX: t0.clientX, clientY: t0.clientY },
        { clientX: t1.clientX, clientY: t1.clientY },
      ];

      if (mode === "scale") {
        const scaleRatio = computePinchScale(prevTouchesRef.current, curr);
        const placed = useARStore
          .getState()
          .placedBlocks.find((p) => p.id === selectedPlacedId);
        if (placed) {
          const newScale = Math.max(0.1, Math.min(5.0, placed.scale * scaleRatio));
          updatePlaced(selectedPlacedId, { scale: newScale });
        }
      } else if (mode === "rotate") {
        const delta = computeRotationDelta(prevTouchesRef.current, curr);
        const placed = useARStore
          .getState()
          .placedBlocks.find((p) => p.id === selectedPlacedId);
        if (placed) {
          const newRotY = placed.rotation[1] + delta;
          updatePlaced(selectedPlacedId, {
            rotation: [placed.rotation[0], newRotY, placed.rotation[2]],
          });
        }
      }

      prevTouchesRef.current = curr;
    },
    [mode, selectedPlacedId, updatePlaced],
  );

  const handleTouchEnd = useCallback(() => {
    prevTouchesRef.current = null;
  }, []);

  return (
    <div className="fixed inset-0 z-10 flex flex-col">
      {/* 上部バー */}
      <div className="flex items-center justify-between p-3">
        <button
          onClick={onExit}
          className="rounded-xl bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm"
        >
          ← 戻る
        </button>
        <button
          onClick={handleDelete}
          disabled={!selectedPlacedId}
          className="rounded-xl bg-red-600/80 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm disabled:opacity-30"
        >
          削除
        </button>
      </div>

      {/* 中央タッチエリア（配置・ジェスチャー用） */}
      <div
        className="flex-1 flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* モード切替ボタン */}
        <div className="flex gap-2">
          {(Object.keys(MODE_LABELS) as ARMode[]).map((m) => (
            <button
              key={m}
              onClick={(e) => {
                e.stopPropagation();
                setMode(m);
              }}
              className={`rounded-xl px-3 py-2 text-xs font-medium backdrop-blur-sm ${
                mode === m
                  ? "bg-white/90 text-black"
                  : "bg-black/50 text-white"
              }`}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* 選択中ブロック表示 */}
      {activeDefinitionId && (
        <div className="px-3 pb-1">
          <span className="text-xs text-white/70">
            選択中: {blocks.find((b) => b.id === activeDefinitionId)?.name ?? ""}
          </span>
        </div>
      )}

      {/* 下部: ブロック選択パネル */}
      <div className="bg-black/50 p-3 backdrop-blur-sm safe-area-bottom">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {blocks.map((block) => (
            <button
              key={block.id}
              onClick={() => setActiveDefinition(block.id)}
              className={`flex shrink-0 flex-col items-center gap-1 rounded-xl px-3 py-2 ${
                activeDefinitionId === block.id
                  ? "bg-white/20 ring-2 ring-white"
                  : "bg-black/40"
              }`}
            >
              <div
                className="h-10 w-10 rounded-lg"
                style={{ backgroundColor: block.color }}
              />
              <span className="text-xs text-white">{block.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
