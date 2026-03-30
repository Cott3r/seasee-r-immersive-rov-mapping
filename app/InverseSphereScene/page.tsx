import InverseSphereScene from "./InverseSphereScene";
import { getPanoramaItems } from "./panoramas";

export default async function Page() {
  const panoramas = await getPanoramaItems();
  return <InverseSphereScene panoramas={panoramas} />;
}