import { TripOffersWeb } from './web/TripOffersWeb';

import type { StackProps } from '../navigation';

/** A posted trip and its offers. One responsive layout for web and phone. */
export function TripOffersScreen({ route }: StackProps<'TripOffers'>) {
  return <TripOffersWeb tripId={route.params.tripId} />;
}
