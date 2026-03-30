export type ProjectionMode = "perspective" | "rectilinear";

export type PanoramaItem = {
  label: string;
  src: string;
};

export type XmpData = {
  fullWidth: number;
  fullHeight: number;
  cropWidth: number;
  cropHeight: number;
  cropLeft: number;
  cropTop: number;
};
