import type { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';

// Central route type map. Every screen's params live here so navigation is fully typed:
// navigation.navigate('HostProfile', { listingId }) is checked at compile time.
export type RootStackParamList = {
  Tabs: undefined;
  HostProfile: { listingId: string };
  Connection: { hostId: string };
  GuestBook: { hostId: string };
  /** draft: open the composer pre-filled with a Kiki-drafted message (the cold-state card). Nothing sends until the member does. */
  Thread: { memberId: string; draft?: { kind: 'introduce' | 'call' | 'shorter'; as: 'host' | 'guest'; nights?: number } };
  /** as: who is reading (derived from the entry, not a toggle). requestId: set when a host opens a guest from Requests. */
  Trust: { hostId: string; as?: 'host' | 'guest'; requestId?: string };
  Onboard: undefined;
  TripOffers: { tripId: 'italy' | 'created' };
  PlanTrip: undefined;
  /** The match moment: shown once after slide-to-match, held until dismissed. */
  Matched: { guestId: string; startInDays: number; nights: number };
  Notifications: undefined;
  /** Asking to stay: dates, the host's house list (care items ticked), a line, a real request. */
  RequestStay: { listingId: string };
};

export type RootTabParamList = {
  Explore: undefined;
  Requests: undefined;
  Community: undefined;
  Trips: undefined;
  Messages: undefined;
  Me: undefined;
};

export type StackProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

/** Root-stack navigation for tab screens that push detail screens (via useNavigation). */
export type RootNav = NativeStackNavigationProp<RootStackParamList>;
