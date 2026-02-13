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

  // ヒットテストは常時有効（モードに関係なく位置を取得）
  useXRHitTest(
    (results, getWorldMatrix) => {
      if (results.length === 0) return;
      getWorldMatrix(_matrix, results[0]);
      _position.setFromMatrixPosition(_matrix);
      useARStore.setState({
        hitPosition: _position.toArray() as [number, number, number],
      });
    },
    "viewer",
  );

  // レティクルは配置モード時のみ表示
  useFrame(() => {
    if (!meshRef.current) return;
    const hitPos = useARStore.getState().hitPosition;
    const mode = useARStore.getState().mode;
    if (hitPos && mode === "place") {
      meshRef.current.position.set(hitPos[0], hitPos[1], hitPos[2]);
      meshRef.current.visible = true;
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
