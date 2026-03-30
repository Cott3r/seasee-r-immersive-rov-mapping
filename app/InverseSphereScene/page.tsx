import { Suspense } from "react";
import InverseSphereScene from "./InverseSphereScene";
import { getPanoramaItems } from "./panoramas";

export default async function Page() {
  const panoramas = await getPanoramaItems();
  return (
    <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white">Loading...</div>}>
      <InverseSphereScene panoramas={panoramas} />
    </Suspense>
  );
}