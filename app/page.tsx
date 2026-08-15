import { Suspense } from "react";

import { RoiApp } from "@/components/roi/roi-app";

export default function Home() {
  return (
    <Suspense fallback={<main className="p-6 text-sm text-muted-foreground">Loading</main>}>
      <RoiApp />
    </Suspense>
  );
}
