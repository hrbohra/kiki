import type { ImageSourcePropType } from 'react-native';

// Real interior photos per listing (Creative Commons via Openverse — see
// assets/listings/ATTRIBUTIONS.md). Kept out of the pure domain layer so the fixtures stay
// require()-free and unit-testable in plain Node.
const PHOTOS: Record<string, ImageSourcePropType> = {
  'l-emma': require('../../assets/listings/emma.jpg'),
  'l-katelin': require('../../assets/listings/katelin.jpg'),
  'l-danica': require('../../assets/listings/danica.jpg'),
  'l-ollie': require('../../assets/listings/ollie.jpg'),
  'l-nate': require('../../assets/listings/nate.jpg'),
  'l-priya': require('../../assets/listings/priya.jpg'),
};

export function photoFor(listingId: string): ImageSourcePropType | undefined {
  return PHOTOS[listingId];
}
