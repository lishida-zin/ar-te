"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useXRHitTest } from "@react-three/xr";
import { Matrix4, Mesh, Vector3 } from "three";
import { useARStore } from "@/store/ar-store";

const _matrix = new Matrix4();
const _position = new Vector3();

export function HitIndicator() {
  const meshRef = useRef<Mesh>(null);
  const mode = useARStore((s) => s.mode);
  const visible = mode === "place";

  useXRHitTest(
    visible
      ? (results, getWorldMatrix) => {
          if (results.length === 0) return;
          getWorldMatrix(_matrix, results[0]);
          _position.setFromMatrixPosition(_matrix);
          // Store hit position for placement
          useARStore.setState({ hitPosition: _position.toArray() as [number, number, number] });
        }
      : undefined,
    "viewer",
  );

  useFrame(() => {
    if (!meshRef.current) return;
    const hitPos = useARStore.getState().hitPosition;
    if (hitPos) {
      meshRef.current.position.set(hitPos[0], hitPos[1], hitPos[2]);
      meshRef.current.visible = visible;
    } else {
      meshRef.current.visible = false;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[0.08, 0.1, 32]} />
      <meshBasicMaterial color="#22c55e" transparent opacity={0.6} />
    </mesh>
  );
}
