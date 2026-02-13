import { create } from "zustand";
import { nanoid } from "nanoid";
import type { ARMode, PlacedBlock } from "@/types";

interface ARStore {
  placedBlocks: PlacedBlock[];
  selectedPlacedId: string | null;
  mode: ARMode;
  activeDefinitionId: string | null; // 配置用に選択中のブロック定義
  hitPosition: [number, number, number] | null; // ヒットテスト位置

  setMode: (mode: ARMode) => void;
  setActiveDefinition: (id: string | null) => void;
  selectPlaced: (id: string | null) => void;

  placeBlock: (
    definitionId: string,
    position: [number, number, number]
  ) => void;
  updatePlaced: (id: string, updates: Partial<Omit<PlacedBlock, "id" | "definitionId">>) => void;
  deletePlaced: (id: string) => void;
  clearAll: () => void;
}

export const useARStore = create<ARStore>()((set) => ({
  placedBlocks: [],
  selectedPlacedId: null,
  mode: "place",
  activeDefinitionId: null,
  hitPosition: null,

  setMode: (mode) => set({ mode }),
  setActiveDefinition: (id) => set({ activeDefinitionId: id }),
  selectPlaced: (id) => set({ selectedPlacedId: id }),

  placeBlock: (definitionId, position) => {
    const placed: PlacedBlock = {
      id: nanoid(),
      definitionId,
      position,
      rotation: [0, 0, 0],
      scale: 1,
    };
    set((state) => ({
      placedBlocks: [...state.placedBlocks, placed],
      selectedPlacedId: placed.id,
    }));
  },

  updatePlaced: (id, updates) => {
    set((state) => ({
      placedBlocks: state.placedBlocks.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  },

  deletePlaced: (id) => {
    set((state) => ({
      placedBlocks: state.placedBlocks.filter((p) => p.id !== id),
      selectedPlacedId:
        state.selectedPlacedId === id ? null : state.selectedPlacedId,
    }));
  },

  clearAll: () => set({ placedBlocks: [], selectedPlacedId: null }),
}));
