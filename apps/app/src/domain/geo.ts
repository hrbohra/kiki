// Tiny, dependency-free map projection for the bespoke Explore map.
// Equirectangular is exact enough at city scale (a few km) and lets us place pins
// with plain math instead of a heavyweight native map SDK.

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Bounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface Size {
  width: number;
  height: number;
}

/** Bounding box that contains all points, padded by `pad` (fraction of span). */
export function boundsOf(points: LatLng[], pad = 0.15): Bounds {
  if (points.length === 0) return { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 };
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const p of points) {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLng = Math.min(minLng, p.lng);
    maxLng = Math.max(maxLng, p.lng);
  }
  // Guard against a zero-span box (single point) so projection never divides by zero.
  const latSpan = maxLat - minLat || 0.01;
  const lngSpan = maxLng - minLng || 0.01;
  return {
    minLat: minLat - latSpan * pad,
    maxLat: maxLat + latSpan * pad,
    minLng: minLng - lngSpan * pad,
    maxLng: maxLng + lngSpan * pad,
  };
}

/**
 * Project a lat/lng into pixel x/y within `size`, given `bounds`.
 * Longitude maps left→right; latitude maps top→bottom (north is up, so higher lat = smaller y).
 */
export function project(point: LatLng, bounds: Bounds, size: Size): { x: number; y: number } {
  const { minLat, maxLat, minLng, maxLng } = bounds;
  const fx = (point.lng - minLng) / (maxLng - minLng);
  const fy = (maxLat - point.lat) / (maxLat - minLat);
  return {
    x: clamp01(fx) * size.width,
    y: clamp01(fy) * size.height,
  };
}

function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

/**
 * Web-Mercator projection of a lng/lat into pixel coordinates within a slippy-map tile grid
 * whose top-left tile is (x0, y0) at zoom z. This is what lets us drop pins onto the real
 * bundled CARTO tiles at (roughly) their true London positions. `tileLogical` is the tile's
 * logical size in the mercator coordinate system (256), independent of the raster's retina px.
 */
export function mercatorTilePixel(
  lng: number,
  lat: number,
  z: number,
  x0: number,
  y0: number,
  tileLogical = 256,
): { x: number; y: number } {
  const n = Math.pow(2, z);
  const worldX = ((lng + 180) / 360) * n * tileLogical;
  const latRad = (lat * Math.PI) / 180;
  const worldY =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n * tileLogical;
  return { x: worldX - x0 * tileLogical, y: worldY - y0 * tileLogical };
}
