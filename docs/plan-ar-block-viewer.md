# 実装プラン: AR ブロックビューア

## 概要

スマホ（Google Pixel 9）のカメラを通して、自作3Dブロックを現実世界にAR表示するWebアプリ。ブロック設定画面で形状・色・サイズを定義し、AR画面で配置・移動・拡縮・回転の操作を行う。

## 要件サマリー

| ID  | 要件                                       | 優先度 |
| --- | ------------------------------------------ | ------ |
| F1  | ブロック設定画面（作成・編集・削除・プレビュー） | Must   |
| F2  | AR起動画面（カメラ映像 + 3Dオーバーレイ）      | Must   |
| F3  | 平面検出 + タップでブロック配置                | Must   |
| F4  | 配置済みブロックの移動・拡縮・回転             | Must   |
| F5  | ブロックデータの永続化（localStorage）         | Must   |
| F6  | Vercel デプロイ（HTTPS必須 for WebXR）        | Must   |
| F7  | 配置済みブロックの削除                        | Should |

## 技術設計

### 技術スタック

| カテゴリ     | 技術                          | 理由                                      |
| ------------ | ----------------------------- | ----------------------------------------- |
| フレームワーク | Next.js 15 (App Router)       | ルーティング、SSR制御、Vercelデプロイ容易    |
| 3D エンジン  | Three.js + React Three Fiber  | React統合、宣言的3D記述                     |
| AR           | @react-three/xr v6            | WebXR統合、hit-test/dom-overlay対応         |
| 3D ヘルパー  | @react-three/drei             | OrbitControls、形状プリミティブ等            |
| 状態管理     | Zustand                       | 軽量、React外からもアクセス可能              |
| スタイリング | Tailwind CSS v4               | ユーティリティファースト、高速開発            |
| 永続化       | localStorage                  | テスト用途に十分                            |
| デプロイ     | Vercel                        | 無料HTTPS、Next.jsネイティブ対応             |

### WebXR 要件

- **セッションタイプ**: `immersive-ar`
- **必須機能**: `hit-test`, `dom-overlay`, `local-floor`
- **対象ブラウザ**: Chrome for Android 82+
- **対象デバイス**: Google Pixel 9（ARCore対応済み）

### データモデル

```typescript
// ブロック定義（設定画面で作成）
interface BlockDefinition {
  id: string               // nanoid
  name: string             // 表示名
  shape: 'cube' | 'sphere' | 'cylinder'
  color: string            // hex color (#ff0000)
  size: {
    width: number          // X軸 (0.05〜2.0m)
    height: number         // Y軸 (0.05〜2.0m)
    depth: number          // Z軸 (0.05〜2.0m)
  }
  createdAt: number
}

// 配置済みブロック（AR画面内の状態、非永続）
interface PlacedBlock {
  id: string
  definitionId: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number            // 均一スケール (0.1〜5.0)
}
```

### ディレクトリ構成

```
ar-te/
├── src/
│   ├── app/
│   │   ├── layout.tsx            # ルートレイアウト
│   │   ├── page.tsx              # ホーム（ブロック設定画面）
│   │   └── ar/
│   │       └── page.tsx          # AR起動画面
│   ├── components/
│   │   ├── blocks/
│   │   │   ├── block-form.tsx    # ブロック作成/編集フォーム
│   │   │   ├── block-list.tsx    # ブロック一覧
│   │   │   └── block-preview.tsx # 3Dプレビュー（R3F Canvas）
│   │   └── ar/
│   │       ├── ar-scene.tsx      # ARシーン（XR + Canvas）
│   │       ├── ar-overlay.tsx    # DOM Overlay UI
│   │       ├── block-mesh.tsx    # ブロック3Dメッシュ
│   │       ├── hit-indicator.tsx # 配置位置レティクル
│   │       └── placed-blocks.tsx # 配置済みブロック管理
│   ├── store/
│   │   ├── block-store.ts       # ブロック定義ストア（Zustand + localStorage）
│   │   └── ar-store.ts          # AR状態ストア（配置済み、選択中、モード）
│   ├── lib/
│   │   └── gestures.ts          # タッチジェスチャー処理（ドラッグ、ピンチ、回転）
│   └── types/
│       └── index.ts             # 型定義
├── public/
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .gitignore
```

### 画面設計

#### 1. ブロック設定画面 (`/`)

```
┌──────────────────────────┐
│  🧊 AR-TE  [AR起動 →]    │  ← ヘッダー
├──────────────────────────┤
│                          │
│  ┌────┐ ┌────┐ ┌────┐   │  ← ブロック一覧（グリッド）
│  │ 3D │ │ 3D │ │ ＋ │   │     各カードに3Dプレビュー
│  │prev│ │prev│ │追加│   │
│  │    │ │    │ │    │   │
│  │Red │ │Blue│ │    │   │
│  │Cube│ │Cyl │ │    │   │
│  └────┘ └────┘ └────┘   │
│                          │
├──────────────────────────┤  ← 選択時: 編集フォーム
│  名前:  [Red Cube     ]  │
│  形状:  ○立方体 ○球 ○円柱│
│  色:    [■ #ff0000    ]  │
│  サイズ:                  │
│    幅  ──●────── 0.3m    │
│    高さ ────●──── 0.5m    │
│    奥行 ──●────── 0.3m    │
│  [削除]          [保存]   │
└──────────────────────────┘
```

#### 2. AR起動画面 (`/ar`)

```
┌──────────────────────────┐
│ [← 戻る]     [🗑 削除]    │  ← DOM Overlay UI
│                          │
│                          │
│      📷 カメラ映像        │  ← WebXR immersive-ar
│                          │
│         ◎ レティクル      │  ← hit-test 結果の表示
│      ┌──────┐            │
│      │ 配置 │            │  ← タップで配置
│      │ 済み │            │
│      └──────┘            │
│                          │
│  モード: ○配置 ○移動 ○拡縮│  ← 操作モード切替
├──────────────────────────┤
│ [Cube1] [Cyl1] [Sph1]   │  ← ブロック選択パネル
└──────────────────────────┘
```

### AR操作モデル

| モード | 操作                | 動作                                 |
| ------ | ------------------- | ------------------------------------ |
| 配置   | 画面タップ           | 選択中ブロックをレティクル位置に配置    |
| 移動   | ブロックをドラッグ    | hit-test結果に沿って平面上を移動      |
| 拡縮   | ピンチイン/アウト     | 選択ブロックの均一スケール変更         |
| 回転   | 二本指回転           | 選択ブロックのY軸回転                 |
| 選択   | ブロックをタップ      | 操作対象の切り替え（全モード共通）      |
| 削除   | 削除ボタン           | 選択中ブロックを除去                  |

## 実装ステップ

### Phase 1: プロジェクト基盤

1. Next.js 15 プロジェクト初期化（`pnpm create next-app`）
2. 依存追加: `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/xr`, `zustand`, `nanoid`
3. Tailwind CSS v4 設定
4. 型定義ファイル作成
5. `.gitignore` 設定（`node_modules/`, `.next/`, `.env*`）

### Phase 2: 状態管理 + データ層

1. `block-store.ts` — ブロック定義の CRUD + localStorage 永続化
2. `ar-store.ts` — 配置済みブロック、選択状態、操作モード
3. 初期ブロック3つをシードデータとして登録（テスト用）

### Phase 3: ブロック設定画面

1. `block-preview.tsx` — R3F Canvas で形状の3Dプレビュー（OrbitControls付き）
2. `block-form.tsx` — 作成/編集フォーム（形状選択、カラーピッカー、サイズスライダー）
3. `block-list.tsx` — グリッド表示 + 追加カード
4. `page.tsx` — レイアウト統合、AR画面への遷移ボタン

### Phase 4: AR シーン（コア）

1. `ar-scene.tsx` — XR + Canvas セットアップ（`"use client"` + dynamic import `ssr: false`）
2. `block-mesh.tsx` — BlockDefinition → Three.js Mesh 変換コンポーネント
3. `hit-indicator.tsx` — XRHitTest でレティクル表示
4. `placed-blocks.tsx` — 配置済みブロックのレンダリング
5. `ar-overlay.tsx` — DOM Overlay（ブロック選択パネル、モード切替、戻るボタン）

### Phase 5: AR インタラクション

1. `gestures.ts` — タッチジェスチャー検出（ドラッグ、ピンチ、二本指回転）
2. 配置モード: タップ → hit-test位置にブロック追加
3. 移動モード: ドラッグ → hit-test追従で平面上移動
4. 拡縮モード: ピンチ → scale値変更
5. 回転: 二本指回転 → Y軸rotation変更
6. タップ選択: Raycaster でオブジェクト選択

### Phase 6: デプロイ + テスト

1. Vercel にデプロイ（HTTPS 確保）
2. Pixel 9 Chrome でアクセス・動作確認
3. 微調整（レティクルサイズ、UI配置等）

## リスクと対策

| リスク | 影響 | 対策 |
| ------ | ---- | ---- |
| @react-three/xr v6 の API 不安定 | AR機能が動作しない | raw WebXR API にフォールバック可能な設計 |
| DOM Overlay のイベント伝播 | タッチがAR/UIで競合 | `pointer-events` 制御 + イベント分離 |
| Next.js SSR と Three.js の競合 | ビルドエラー | dynamic import + `ssr: false` で回避 |
| ジェスチャー精度 | 操作が不安定 | モード切替方式で操作を明確に分離 |

## 前提・仮定

- ブロックはパラメトリック形状（cube/sphere/cylinder）。外部3Dモデルのインポートは対象外
- 配置済みブロックはセッション内のみ保持（ページリロードでリセット）
- 1画面に配置するブロック数は10個程度を想定（パフォーマンス考慮）
