import { StatusBar } from 'expo-status-bar';
import { Platform, Pressable, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { ExploreScreen } from './src/screens/ExploreScreen';
import { RequestsScreen } from './src/screens/RequestsScreen';
import { CommunityScreen } from './src/screens/CommunityScreen';
import { TripsScreen } from './src/screens/TripsScreen';
import { MessagesScreen } from './src/screens/MessagesScreen';
import { MeScreen } from './src/screens/MeScreen';
import { HostProfileScreen } from './src/screens/HostProfileScreen';
import { ConnectionScreen } from './src/screens/ConnectionScreen';
import { GuestBookScreen } from './src/screens/GuestBookScreen';
import { ThreadScreen } from './src/screens/ThreadScreen';
import { TrustScreen } from './src/screens/TrustScreen';
import { OnboardScreen } from './src/screens/OnboardScreen';
import { TripOffersScreen } from './src/screens/TripOffersScreen';
import { PlanTripScreen } from './src/screens/PlanTripScreen';
import { color, shadow } from './src/theme/tokens';
import { TAB_ICON } from './src/ui/TabIcons';
import { useResponsive } from './src/ui/useResponsive';
import { WebShell } from './src/screens/web/WebShell';
import { DemoEntry } from './src/screens/DemoEntry';
import { hasOnboarded, resetOnboarded } from './src/demo/onboarding';
import { SessionProvider, useSession } from './src/api/session';
import { WorldProvider } from './src/api/world-provider';
import type { RootStackParamList, RootTabParamList } from './src/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

/** A muted, demo-only affordance to replay the invite flow from the top. Not product chrome. */
function ResetDemoButton() {
  const replay = () => {
    resetOnboarded();
    if (navigationRef.isReady()) navigationRef.navigate('Onboard');
  };
  return (
    <Pressable onPress={replay} style={({ hovered }: any) => [styles.reset, hovered && styles.resetHover]} accessibilityRole="button" accessibilityLabel="Reset demo">
      <Text style={styles.resetText}>⟲  Reset demo</Text>
    </Pressable>
  );
}

/** Desktop browser gets the site-wide web shell; phone/narrow keeps the bottom-tab layout. */
function Tabs() {
  const { isWide } = useResponsive();
  if (isWide) return <WebShell />;
  return <BottomTabs />;
}

function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: color.brand,
        tabBarInactiveTintColor: color.inkFaint,
        tabBarStyle: { backgroundColor: color.surface, borderTopColor: color.hairline, paddingTop: 9, height: 74 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        tabBarIcon: ({ color: c }) => {
          const Icon = TAB_ICON[route.name];
          return <Icon color={c} size={22} />;
        },
      })}
    >
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Requests" component={RequestsScreen} />
      <Tab.Screen name="Community" component={CommunityScreen} />
      <Tab.Screen name="Trips" component={TripsScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Me" component={MeScreen} options={{ tabBarLabel: 'Me/Home' }} />
    </Tab.Navigator>
  );
}

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: color.bg, primary: color.brand },
};

/** Gates on the real session: one-tap demo login (or real OTP) before the app. */
function AppInner() {
  const { user, ready } = useSession();
  const seen = hasOnboarded();

  if (!ready) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
      </SafeAreaProvider>
    );
  }
  if (!user) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <DemoEntry />
      </SafeAreaProvider>
    );
  }
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <WorldProvider>
        <NavigationContainer theme={navTheme} ref={navigationRef} initialState={seen ? undefined : { index: 1, routes: [{ name: 'Tabs' }, { name: 'Onboard' }] }}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Tabs" component={Tabs} />
            <Stack.Screen name="HostProfile" component={HostProfileScreen} />
            <Stack.Screen name="Connection" component={ConnectionScreen} />
            <Stack.Screen name="GuestBook" component={GuestBookScreen} />
            <Stack.Screen name="Thread" component={ThreadScreen} />
            <Stack.Screen name="Trust" component={TrustScreen} />
            <Stack.Screen name="Onboard" component={OnboardScreen} />
            <Stack.Screen name="TripOffers" component={TripOffersScreen} />
            <Stack.Screen name="PlanTrip" component={PlanTripScreen} />
          </Stack.Navigator>
        </NavigationContainer>
        <ResetDemoButton />
      </WorldProvider>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <AppInner />
    </SessionProvider>
  );
}

const styles = StyleSheet.create({
  reset: {
    position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
    right: 16, bottom: 16, zIndex: 100, opacity: 0.6,
    backgroundColor: 'rgba(255,255,255,0.85)', borderWidth: 1, borderColor: color.hairline,
    borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8, ...shadow.card,
  },
  resetHover: { opacity: 1, backgroundColor: '#FFFFFF' },
  resetText: { fontSize: 12, fontWeight: '600', color: color.inkFaint },
});
