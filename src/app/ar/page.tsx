"use client";

import dynamic from "next/dynamic";
import { ARErrorBoundary } from "@/components/ar/error-boundary";

const ArScene = dynamic(
  () => import("@/components/ar/ar-scene").then((mod) => mod.ArScene),
  { ssr: false },
);

export default function ARPage() {
  return (
    <ARErrorBoundary>
      <ArScene />
    </ARErrorBoundary>
  );
}
