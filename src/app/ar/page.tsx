"use client";

import dynamic from "next/dynamic";

const ArScene = dynamic(
  () => import("@/components/ar/ar-scene").then((mod) => mod.ArScene),
  { ssr: false },
);

export default function ARPage() {
  return <ArScene />;
}
