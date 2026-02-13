"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { BlockDefinition } from "@/types";

function BlockMesh({ block }: { block: BlockDefinition }) {
  const { shape, color, size } = block;

  switch (shape) {
    case "sphere":
      return (
        <mesh>
          <sphereGeometry args={[size.width / 2, 32, 32]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
    case "cylinder":
      return (
        <mesh>
          <cylinderGeometry args={[size.width / 2, size.width / 2, size.height, 32]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
    default:
      return (
        <mesh>
          <boxGeometry args={[size.width, size.height, size.depth]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
  }
}

export function BlockPreview({ block }: { block: BlockDefinition }) {
  return (
    <div className="h-[150px] w-[150px] overflow-hidden rounded-lg">
      <Canvas
        camera={{ position: [0.5, 0.5, 0.5], fov: 50 }}
        gl={{ alpha: false }}
        style={{ background: "#1e293b" }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 3, 1]} intensity={0.8} />
        <BlockMesh block={block} />
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}
