export type BlockShape = "cube" | "sphere" | "cylinder";

export interface BlockSize {
  width: number; // X軸 (0.05〜2.0m)
  height: number; // Y軸 (0.05〜2.0m)
  depth: number; // Z軸 (0.05〜2.0m)
}

/** ブロック定義（設定画面で作成） */
export interface BlockDefinition {
  id: string;
  name: string;
  shape: BlockShape;
  color: string; // hex (#ff0000)
  size: BlockSize;
  createdAt: number;
}

/** 配置済みブロック（AR画面内の状態、非永続） */
export interface PlacedBlock {
  id: string;
  definitionId: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number; // 均一スケール (0.1〜5.0)
}

export type ARMode = "place" | "move" | "scale" | "rotate";
