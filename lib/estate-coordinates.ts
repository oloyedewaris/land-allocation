import type { EstateMeta, Point } from "@/types/estate";

function utmToLatLon(easting: number, northing: number): Point {
  const a = 6378249.145, f = 1 / 293.465, k0 = 0.9996, falseEasting = 500000, lon0 = 9 * Math.PI / 180;
  const e2 = f * (2 - f), ep2 = e2 / (1 - e2), meridian = northing / k0;
  const mu = meridian / (a * (1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256));
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const phi1 = mu + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu) + (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu) + 151 * e1 ** 3 / 96 * Math.sin(6 * mu) + 1097 * e1 ** 4 / 512 * Math.sin(8 * mu);
  const s1 = Math.sin(phi1), c1 = Math.cos(phi1), t1 = Math.tan(phi1), c = ep2 * c1 ** 2, t = t1 ** 2;
  const n1 = a / Math.sqrt(1 - e2 * s1 ** 2), r1 = a * (1 - e2) / (1 - e2 * s1 ** 2) ** 1.5, d = (easting - falseEasting) / (n1 * k0);
  const lat = phi1 - (n1 * t1 / r1) * (d ** 2 / 2 - (5 + 3 * t + 10 * c - 4 * c ** 2 - 9 * ep2) * d ** 4 / 24 + (61 + 90 * t + 298 * c + 45 * t ** 2 - 252 * ep2 - 3 * c ** 2) * d ** 6 / 720);
  const lon = lon0 + (d - (1 + 2 * t + c) * d ** 3 / 6 + (5 - 2 * c + 28 * t - 3 * c ** 2 + 8 * ep2 + 24 * t ** 2) * d ** 5 / 120) / c1;
  const sinLat = Math.sin(lat), cosLat = Math.cos(lat), radius = a / Math.sqrt(1 - e2 * sinLat ** 2);
  let x = radius * cosLat * Math.cos(lon) - 92, y = radius * cosLat * Math.sin(lon) - 93, z = radius * (1 - e2) * sinLat + 122;
  const wa = 6378137, wf = 1 / 298.257223563, we2 = wf * (2 - wf), distance = Math.hypot(x, y);
  let latitude = Math.atan2(z, distance * (1 - we2));
  for (let index = 0; index < 4; index++) { const sine = Math.sin(latitude); const nr = wa / Math.sqrt(1 - we2 * sine ** 2); latitude = Math.atan2(z + we2 * nr * sine, distance); }
  return [latitude * 180 / Math.PI, Math.atan2(y, x) * 180 / Math.PI];
}

export function unitCoordinates(center: Point, meta: EstateMeta): Point {
  const source = utmToLatLon(meta.E0 + center[0] / meta.s, meta.N0 - center[1] / meta.s);
  return [source[0] + (6.71114 - 9.1438341676), source[1] + (3.79646 - 7.4405954148)];
}
