import type { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';

// Central route type map. Every screen's params live here so navigation is fully typed:
// navigation.navigate('HostProfile', { listingId }) is checked at compile time.
export type RootStackParamList = {
  Tabs: undefined;
  HostProfile: { listingId: string };
  Connection: { hostId: string };
  GuestBook: { hostId: string };
  Thread: { memberId: string };
  Trust: { hostId: string };
  Onboard: undefined;
  TripOffers: { tripId: 'italy' | 'created' };
  PlanTrip: undefined;
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
