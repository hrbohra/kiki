import type { ImageSourcePropType } from 'react-native';

// Placeholder profile portraits, one per member (randomuser.me — free dummy-user avatars,
// their intended use). Kept out of the pure domain layer so fixtures stay require()-free and
// unit-testable. Members without an entry fall back to a gradient monogram.
const PHOTOS: Record<string, ImageSourcePropType> = {
  you: require('../../assets/avatars/you.jpg'),
  emma: require('../../assets/avatars/emma.jpg'),
  bella: require('../../assets/avatars/bella.jpg'),
  sophie: require('../../assets/avatars/sophie.jpg'),
  amy: require('../../assets/avatars/amy.jpg'),
  katelin: require('../../assets/avatars/katelin.jpg'),
  danica: require('../../assets/avatars/danica.jpg'),
  priya: require('../../assets/avatars/priya.jpg'),
  lena: require('../../assets/avatars/lena.jpg'),
  ollie: require('../../assets/avatars/ollie.jpg'),
  nate: require('../../assets/avatars/nate.jpg'),
  theo: require('../../assets/avatars/theo.jpg'),
};

export function avatarPhotoFor(id?: string): ImageSourcePropType | undefined {
  return id ? PHOTOS[id] : undefined;
}
