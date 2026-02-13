"use client";

import { useState } from "react";
import Link from "next/link";
import { useBlockStore } from "@/store/block-store";
import { BlockList } from "@/components/blocks/block-list";
import { BlockForm } from "@/components/blocks/block-form";

export default function Home() {
  const { selectedBlockId, getBlock, selectBlock } = useBlockStore();
  const [showForm, setShowForm] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const selectedBlock = selectedBlockId ? getBlock(selectedBlockId) ?? null : null;

  const handleAdd = () => {
    selectBlock(null);
    setIsNew(true);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setIsNew(false);
  };

  // 選択時にフォームを開く
  const formBlock = isNew ? null : selectedBlock;
  const formVisible = showForm || selectedBlockId !== null;

  return (
    <div className="flex min-h-screen flex-col bg-[#0f172a]">
      {/* ヘッダー */}
      <header className="flex items-center justify-between px-4 py-3">
        <h1 className="text-xl font-bold text-[#f1f5f9]">AR-TE</h1>
        <Link
          href="/ar"
          className="rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2563eb]"
        >
          AR起動
        </Link>
      </header>

      {/* コンテンツ */}
      <main className="flex flex-1 flex-col gap-4 px-4 pb-8">
        <BlockList onAdd={handleAdd} />

        {formVisible && (
          <BlockForm block={formBlock} onClose={handleClose} />
        )}
      </main>
    </div>
  );
}
