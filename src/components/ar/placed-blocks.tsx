"use client";

import { useARStore } from "@/store/ar-store";
import { useBlockStore } from "@/store/block-store";
import { BlockMesh } from "./block-mesh";

export function PlacedBlocks() {
  const placedBlocks = useARStore((s) => s.placedBlocks);
  const selectedPlacedId = useARStore((s) => s.selectedPlacedId);
  const selectPlaced = useARStore((s) => s.selectPlaced);
  const getBlock = useBlockStore((s) => s.getBlock);

  return (
    <>
      {placedBlocks.map((placed) => {
        const definition = getBlock(placed.definitionId);
        if (!definition) return null;
        return (
          <BlockMesh
            key={placed.id}
            definition={definition}
            placed={placed}
            selected={placed.id === selectedPlacedId}
            onSelect={selectPlaced}
          />
        );
      })}
    </>
  );
}
