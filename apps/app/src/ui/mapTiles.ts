import type { ImageSourcePropType } from 'react-native';

// A bundled CARTO "light" basemap of central London (© OpenStreetMap contributors, © CARTO),
// stitched from a 3×3 tile grid at zoom 12 (top-left tile 2045,1361) into one image. Bundling
// it keeps the map real, dependency-free (no native map SDK) and fully offline — which matters
// for recording in the Appetize simulator. The logical grid is 3×256 = 768 mercator units.
export const MAP_GRID = { z: 12, x0: 2045, y0: 1361, cols: 3, rows: 3, tileLogical: 256 } as const;

export const LONDON_MAP: ImageSourcePropType = require('../../assets/map/london.jpg');
