import { Suspense } from "react";
import InverseSphereScene from "./inverse-sphere-scene";
import {getPanoramas} from "@/utils/panorama-file-scanner";

export default async function Page() {
  const panoramas = await getPanoramas();
  return (
    <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white">Loading...</div>}>
      <InverseSphereScene panoramas={panoramas} />
    </Suspense>
  );
}