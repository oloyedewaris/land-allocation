export type Point = [number, number];
export type UnitStatus = "available" | "allocated" | "reserved";
export type ViewMode = "map" | "plan" | "aerial";
export type ShadingMode = "realistic" | "status";

export interface EstateMeta {
  estate: string;
  location: string;
  w: number;
  h: number;
  E0: number;
  N0: number;
  s: number;
  cx: number;
  cz: number;
  r: number;
  siteHa: number;
  netHa: number;
  regularPlotCount: number;
  regularPlotSizesSqm: number[];
}

export interface EstateUnit {
  id: string;
  s: string;
  n: number;
  r: Point[];
  c: Point;
  a: number;
  oa: number;
  dim: string;
  ptype: string;
  lu?: string;
  hx?: number;
  f?: string[];
}

export interface AmenityParcel {
  r: Point[];
  a: number;
  n: string;
  g: number;
}

export type RoadSegment = [number, number, number, number, number];

export interface EstateModel {
  meta: EstateMeta;
  plots: EstateUnit[];
  parcels: AmenityParcel[];
  roads: RoadSegment[];
  site: Point[][];
}

export interface EstateFilters {
  status: "all" | UnitStatus;
  sectors: string[];
  sizes: number[];
  landUses: string[];
  hatched: "all" | "hatched" | "plain";
  search: string;
}
