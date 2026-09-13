import { describe, expect, it } from 'vitest';
import { boundsOf, project, mercatorTilePixel } from '../geo';

describe('geo projection', () => {
  const size = { width: 100, height: 100 };

  it('places the north-west point near the top-left and south-east near bottom-right', () => {
    const pts = [
      { lat: 51.6, lng: -0.2 }, // NW-ish (high lat, low lng)
      { lat: 51.4, lng: 0.0 }, //  SE-ish (low lat, high lng)
    ];
    const b = boundsOf(pts, 0); // no padding for an exact corner check
    const nw = project(pts[0], b, size);
    const se = project(pts[1], b, size);
    expect(nw.x).toBeLessThan(se.x); // west is left of east
    expect(nw.y).toBeLessThan(se.y); // north is above south
  });

  it('does not divide by zero for a single point', () => {
    const b = boundsOf([{ lat: 51.5, lng: -0.1 }]);
    const p = project({ lat: 51.5, lng: -0.1 }, b, size);
    expect(Number.isFinite(p.x)).toBe(true);
    expect(Number.isFinite(p.y)).toBe(true);
  });

  it('clamps points outside the bounds into the frame', () => {
    const b = { minLat: 51.4, maxLat: 51.6, minLng: -0.2, maxLng: 0.0 };
    const p = project({ lat: 90, lng: 90 }, b, size);
    expect(p.x).toBeLessThanOrEqual(size.width);
    expect(p.y).toBeGreaterThanOrEqual(0);
  });
});

describe('mercatorTilePixel', () => {
  // Bundled map grid: zoom 12, top-left tile (2045, 1361), 3×3 → logical 768×768.
  const z = 12, x0 = 2045, y0 = 1361, grid = 768;

  it('places central-London points inside the 3×3 grid', () => {
    const emma = mercatorTilePixel(-0.0785, 51.5385, z, x0, y0); // De Beauvoir
    expect(emma.x).toBeGreaterThan(0);
    expect(emma.x).toBeLessThan(grid);
    expect(emma.y).toBeGreaterThan(0);
    expect(emma.y).toBeLessThan(grid);
  });

  it('puts west of centre left of east, and north above south', () => {
    const west = mercatorTilePixel(-0.17, 51.5, z, x0, y0);
    const east = mercatorTilePixel(-0.07, 51.5, z, x0, y0);
    const north = mercatorTilePixel(-0.1, 51.56, z, x0, y0);
    const south = mercatorTilePixel(-0.1, 51.44, z, x0, y0);
    expect(west.x).toBeLessThan(east.x);
    expect(north.y).toBeLessThan(south.y);
  });
});
