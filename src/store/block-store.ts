import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { BlockDefinition, BlockShape, BlockSize } from "@/types";

interface BlockStore {
  blocks: BlockDefinition[];
  selectedBlockId: string | null;
  addBlock: (
    name: string,
    shape: BlockShape,
    color: string,
    size: BlockSize
  ) => BlockDefinition;
  updateBlock: (id: string, updates: Partial<Omit<BlockDefinition, "id" | "createdAt">>) => void;
  deleteBlock: (id: string) => void;
  selectBlock: (id: string | null) => void;
  getBlock: (id: string) => BlockDefinition | undefined;
}

const SEED_BLOCKS: BlockDefinition[] = [
  {
    id: "seed-red-cube",
    name: "Red Cube",
    shape: "cube",
    color: "#ef4444",
    size: { width: 0.2, height: 0.2, depth: 0.2 },
    createdAt: Date.now(),
  },
  {
    id: "seed-blue-cylinder",
    name: "Blue Cylinder",
    shape: "cylinder",
    color: "#3b82f6",
    size: { width: 0.15, height: 0.3, depth: 0.15 },
    createdAt: Date.now(),
  },
  {
    id: "seed-green-sphere",
    name: "Green Sphere",
    shape: "sphere",
    color: "#22c55e",
    size: { width: 0.25, height: 0.25, depth: 0.25 },
    createdAt: Date.now(),
  },
];

export const useBlockStore = create<BlockStore>()(
  persist(
    (set, get) => ({
      blocks: SEED_BLOCKS,
      selectedBlockId: null,

      addBlock: (name, shape, color, size) => {
        const block: BlockDefinition = {
          id: nanoid(),
          name,
          shape,
          color,
          size,
          createdAt: Date.now(),
        };
        set((state) => ({ blocks: [...state.blocks, block] }));
        return block;
      },

      updateBlock: (id, updates) => {
        set((state) => ({
          blocks: state.blocks.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        }));
      },

      deleteBlock: (id) => {
        set((state) => ({
          blocks: state.blocks.filter((b) => b.id !== id),
          selectedBlockId:
            state.selectedBlockId === id ? null : state.selectedBlockId,
        }));
      },

      selectBlock: (id) => set({ selectedBlockId: id }),

      getBlock: (id) => get().blocks.find((b) => b.id === id),
    }),
    {
      name: "ar-te-blocks",
    }
  )
);
