"use client";

import { useRef } from "react";
import { Edges } from "@react-three/drei";
import type { Mesh as ThreeMesh } from "three";
import type { BlockDefinition, PlacedBlock } from "@/types";
import { ThreeEvent } from "@react-three/fiber";

interface BlockMeshProps {
  definition: BlockDefinition;
  placed: PlacedBlock;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function BlockMesh({
  definition,
  placed,
  selected,
  onSelect,
}: BlockMeshProps) {
  const meshRef = useRef<ThreeMesh>(null);
  const { shape, color, size } = definition;
  const { position, rotation, scale } = placed;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(placed.id);
  };

  const geometry = (() => {
    switch (shape) {
      case "sphere":
        return <sphereGeometry args={[size.width / 2, 32, 32]} />;
      case "cylinder":
        return (
          <cylinderGeometry
            args={[size.width / 2, size.width / 2, size.height, 32]}
          />
        );
      default:
        return <boxGeometry args={[size.width, size.height, size.depth]} />;
    }
  })();

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      scale={[scale, scale, scale]}
      onClick={handleClick}
    >
      {geometry}
      <meshStandardMaterial color={color} />
      {selected && <Edges color="#ffffff" threshold={15} />}
    </mesh>
  );
}
