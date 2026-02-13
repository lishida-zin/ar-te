"use client";

import { useState, useEffect } from "react";
import { useBlockStore } from "@/store/block-store";
import type { BlockDefinition, BlockShape } from "@/types";

const SHAPES: { value: BlockShape; label: string }[] = [
  { value: "cube", label: "立方体" },
  { value: "sphere", label: "球" },
  { value: "cylinder", label: "円柱" },
];

const DEFAULT_VALUES = {
  name: "",
  shape: "cube" as BlockShape,
  color: "#3b82f6",
  width: 0.2,
  height: 0.2,
  depth: 0.2,
};

interface BlockFormProps {
  block: BlockDefinition | null;
  onClose: () => void;
}

export function BlockForm({ block, onClose }: BlockFormProps) {
  const { addBlock, updateBlock, deleteBlock, selectBlock } = useBlockStore();

  const [name, setName] = useState(DEFAULT_VALUES.name);
  const [shape, setShape] = useState<BlockShape>(DEFAULT_VALUES.shape);
  const [color, setColor] = useState(DEFAULT_VALUES.color);
  const [width, setWidth] = useState(DEFAULT_VALUES.width);
  const [height, setHeight] = useState(DEFAULT_VALUES.height);
  const [depth, setDepth] = useState(DEFAULT_VALUES.depth);

  useEffect(() => {
    if (block) {
      setName(block.name);
      setShape(block.shape);
      setColor(block.color);
      setWidth(block.size.width);
      setHeight(block.size.height);
      setDepth(block.size.depth);
    } else {
      setName(DEFAULT_VALUES.name);
      setShape(DEFAULT_VALUES.shape);
      setColor(DEFAULT_VALUES.color);
      setWidth(DEFAULT_VALUES.width);
      setHeight(DEFAULT_VALUES.height);
      setDepth(DEFAULT_VALUES.depth);
    }
  }, [block]);

  const handleShapeChange = (newShape: BlockShape) => {
    setShape(newShape);
    if (newShape === "sphere") {
      setHeight(width);
      setDepth(width);
    }
  };

  const handleWidthChange = (v: number) => {
    setWidth(v);
    if (shape === "sphere") {
      setHeight(v);
      setDepth(v);
    }
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const size = { width, height, depth };
    if (block) {
      updateBlock(block.id, { name: trimmed, shape, color, size });
    } else {
      const created = addBlock(trimmed, shape, color, size);
      selectBlock(created.id);
    }
    onClose();
  };

  const handleDelete = () => {
    if (block) {
      deleteBlock(block.id);
      selectBlock(null);
      onClose();
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-[#1e293b] p-4">
      <h2 className="text-lg font-semibold">
        {block ? "ブロック編集" : "ブロック追加"}
      </h2>

      {/* 名前 */}
      <label className="flex flex-col gap-1">
        <span className="text-sm text-[#94a3b8]">名前</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-[#334155] bg-[#0f172a] px-3 py-2 text-sm text-[#f1f5f9] outline-none focus:border-[#3b82f6]"
          placeholder="ブロック名"
        />
      </label>

      {/* 形状 */}
      <div className="flex flex-col gap-1">
        <span className="text-sm text-[#94a3b8]">形状</span>
        <div className="flex gap-2">
          {SHAPES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => handleShapeChange(s.value)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                shape === s.value
                  ? "bg-[#3b82f6] text-white"
                  : "bg-[#0f172a] text-[#94a3b8] hover:bg-[#334155]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* 色 */}
      <label className="flex flex-col gap-1">
        <span className="text-sm text-[#94a3b8]">色</span>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-10 cursor-pointer rounded border-none bg-transparent"
          />
          <span className="text-sm text-[#94a3b8]">{color}</span>
        </div>
      </label>

      {/* サイズ */}
      <div className="flex flex-col gap-2">
        <span className="text-sm text-[#94a3b8]">サイズ</span>

        <SizeSlider
          label={shape === "sphere" ? "直径" : "幅"}
          value={width}
          onChange={handleWidthChange}
        />

        {shape !== "sphere" && (
          <>
            <SizeSlider label="高さ" value={height} onChange={setHeight} />
            <SizeSlider label="奥行" value={depth} onChange={setDepth} />
          </>
        )}
      </div>

      {/* ボタン */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 rounded-lg bg-[#3b82f6] py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2563eb]"
        >
          保存
        </button>
        {block && (
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-lg bg-[#ef4444] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#dc2626]"
          >
            削除
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-[#334155] px-4 py-2 text-sm text-[#94a3b8] transition-colors hover:bg-[#475569]"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}

function SizeSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-10 text-xs text-[#94a3b8]">{label}</span>
      <input
        type="range"
        min={0.05}
        max={2.0}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-[#3b82f6]"
      />
      <span className="w-12 text-right text-xs text-[#f1f5f9]">
        {value.toFixed(2)}m
      </span>
    </div>
  );
}
