import type { XmpData } from "../inverse-sphere-scene/types";

export function parseXmpFromJpeg(arrayBuffer: ArrayBuffer): XmpData | null {
  const bytes = new Uint8Array(arrayBuffer);
  const text = new TextDecoder("latin1").decode(bytes);

  const xmpStart = text.indexOf("<x:xmpmeta");
  const xmpEnd = text.indexOf("</x:xmpmeta>");
  if (xmpStart === -1 || xmpEnd === -1) return null;

  const xmp = text.slice(xmpStart, xmpEnd + "</x:xmpmeta>".length);

  const get = (tag: string) => {
    const match = xmp.match(new RegExp(`GPano:${tag}="([^"]+)"`));
    return match ? Number(match[1]) : null;
  };

  const data = {
    fullWidth: get("FullPanoWidthPixels"),
    fullHeight: get("FullPanoHeightPixels"),
    cropWidth: get("CroppedAreaImageWidthPixels"),
    cropHeight: get("CroppedAreaImageHeightPixels"),
    cropLeft: get("CroppedAreaLeftPixels"),
    cropTop: get("CroppedAreaTopPixels"),
  };

  if (Object.values(data).some((value) => value == null || !Number.isFinite(value))) {
    return null;
  }

  return data as XmpData;
}
