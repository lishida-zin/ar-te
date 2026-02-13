"use client";

import { useBlockStore } from "@/store/block-store";
import { BlockPreview } from "./block-preview";

interface BlockListProps {
  onAdd: () => void;
}

export function BlockList({ onAdd }: BlockListProps) {
  const { blocks, selectedBlockId, selectBlock } = useBlockStore();

  return (
    <div className="grid grid-cols-2 gap-3">
      {blocks.map((block) => (
        <button
          key={block.id}
          type="button"
          onClick={() => selectBlock(block.id)}
          className={`flex flex-col items-center gap-2 rounded-xl bg-[#1e293b] p-2 transition-all ${
            selectedBlockId === block.id
              ? "ring-2 ring-[#3b82f6]"
              : "ring-1 ring-transparent hover:ring-[#334155]"
          }`}
        >
          <BlockPreview block={block} />
          <span className="w-full truncate text-center text-sm text-[#f1f5f9]">
            {block.name}
          </span>
        </button>
      ))}

      {/* 追加カード */}
      <button
        type="button"
        onClick={onAdd}
        className="flex h-[190px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#334155] text-[#94a3b8] transition-colors hover:border-[#3b82f6] hover:text-[#3b82f6]"
      >
        <span className="text-3xl">+</span>
        <span className="text-sm">追加</span>
      </button>
    </div>
  );
}
