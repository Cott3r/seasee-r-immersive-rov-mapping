import Image from "next/image";
import Link from "next/link";
import { getPanoramas } from '@/utils/panorama-file-scanner';

export default async function Home() {
  const panoramas = await getPanoramas();
  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="mb-2 text-4xl font-bold text-black dark:text-zinc-50">
          Panorama Gallery
        </h1>
        <p className="mb-8 text-lg text-zinc-600 dark:text-zinc-400">
          Select a panorama to explore in immersive 360° view
        </p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {panoramas.map((panorama, index) => (
            <Link
              key={panorama.filename}
              href={`/inverse-sphere-scene?panorama=${index}`}
              className="group relative overflow-hidden rounded-lg bg-white shadow-md transition-all hover:shadow-xl dark:bg-zinc-900"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                <Image
                  src={`/panoramas/${panorama.filename}`}
                  alt={panorama.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="p-4">
                <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
                  {panorama.name}
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {panorama.filename}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
