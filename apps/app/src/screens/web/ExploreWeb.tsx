import { useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from '../../ui/Avatar';
import { Chip } from '../../ui/Chip';
import { MapCanvas } from '../../ui/MapCanvas';
import { photoFor } from '../../ui/listingPhotos';
import { ReachPill, reachText, WEB_SHADOW } from './webBits';
import { color, radius } from '../../theme/tokens';
import * as world from '../../world';
import type { Listing } from '../../domain/types';
import type { RootNav } from '../../navigation';

const WEB_TAGS = ['Near tube', 'Quiet', 'WFH desk', 'Garden', 'Long stays'];
type Mode = 'homes' | 'map';

// "Vibe" filters are people-first, not amenity-first: they match on who the host is relative to
// YOU (shared hometown, uni, hobby) — the Explore-side of "people over property". Preps the
// AI-vibe-search the product envisions; today it reads the same overlap data the Trust page uses.
const VIBES: { key: string; label: string; kind: string }[] = [
  { key: 'origin', label: 'From your hometown', kind: 'origin' },
  { key: 'education', label: 'Went to your uni', kind: 'education' },
  { key: 'interest', label: 'Shares your hobby', kind: 'interest' },
];
function hostHasOverlap(hostId: string, kind: string): boolean {
  return world.trustStoryFor(hostId).overlaps.some((o) => o.kind === kind);
}

/** Explore — the front door. Homes grid or map, sorted by how close each host is to you. */
export function ExploreWeb() {
  const navigation = useNavigation<RootNav>();
  const [mode, setMode] = useState<Mode>('homes');
  const [connected, setConnected] = useState(false);
  const [tags, setTags] = useState<Set<string>>(new Set());
  const [vibes, setVibes] = useState<Set<string>>(new Set());
  const [pick, setPick] = useState<Listing | null>(null);

  const toggle = (t: string) => setTags((p) => { const n = new Set(p); n.has(t) ? n.delete(t) : n.add(t); return n; });
  const toggleVibe = (k: string) => setVibes((p) => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; });

  const listings = useMemo(() => {
    const f = world.allListings().filter((l) => {
      if (l.hostId === world.viewerId) return false; // don't show your own place
      if (connected && !(Number.isFinite(world.degreeToHost(l.hostId)) && world.degreeToHost(l.hostId) <= 2)) return false;
      for (const t of tags) if (!l.tags.includes(t)) return false;
      for (const v of vibes) { const def = VIBES.find((x) => x.key === v); if (def && !hostHasOverlap(l.hostId, def.kind)) return false; }
      return true;
    });
    return [...f].sort((a, b) => world.degreeToHost(a.hostId) - world.degreeToHost(b.hostId));
  }, [connected, tags, vibes]);

  const open = (l: Listing) => navigation.navigate('HostProfile', { listingId: l.id });

  return (
    <View style={{ gap: 20 }}>
      <View>
        <Text style={styles.h1}>Explore</Text>
        <Text style={styles.sub}>Sorted by how close they are to you, never by price.</Text>
      </View>

      <View style={styles.filterRow}>
        <View style={styles.search}><Text style={styles.searchText}>Search by dates or duration</Text></View>
        <Chip label="Connected only" active={connected} onPress={() => setConnected((v) => !v)} />
        {WEB_TAGS.map((t) => <Chip key={t} label={t} active={tags.has(t)} onPress={() => toggle(t)} />)}
        <View style={{ flex: 1 }} />
        <View style={styles.segment}>
          {(['homes', 'map'] as Mode[]).map((m) => (
            <Pressable key={m} onPress={() => setMode(m)} style={[styles.segBtn, mode === m && styles.segActive]}>
              <Text style={[styles.segText, mode === m && styles.segTextActive]}>{m === 'homes' ? 'Homes' : 'Map'}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.vibeRow}>
        <Text style={styles.vibeLabel}>Your vibe</Text>
        {VIBES.map((v) => <Chip key={v.key} label={v.label} active={vibes.has(v.key)} onPress={() => toggleVibe(v.key)} />)}
      </View>

      {mode === 'homes' ? (
        listings.length ? (
          <View style={styles.grid}>
            {listings.map((l) => <WebListingCard key={l.id} listing={l} onPress={() => open(l)} />)}
          </View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No homes match those filters.</Text>
            <Text style={styles.emptyHint}>Turn one off to widen the search.</Text>
            <Pressable style={styles.clearBtn} onPress={() => { setConnected(false); setTags(new Set()); setVibes(new Set()); }}><Text style={styles.clearBtnText}>Clear filters</Text></Pressable>
          </View>
        )
      ) : (
        <View style={{ gap: 8 }}>
        <View style={styles.mapRow}>
          <View style={styles.mapCanvas}>
            <MapCanvas listings={listings} selectedId={pick?.id ?? null} degreeForHost={world.degreeToHost} onSelect={setPick} />
          </View>
          <View style={[styles.mapPanel, WEB_SHADOW]}>
            {pick ? (
              <>
                <Image source={photoFor(pick.id)} style={styles.panelPhoto} resizeMode="cover" />
                <View style={styles.panelBody}>
                  <View style={styles.panelHead}>
                    <Avatar id={world.hostOf(pick).id} name={world.hostOf(pick).name} tint={world.hostOf(pick).avatarColor} country={world.hostOf(pick).country} size={34} />
                    <Text style={styles.panelName}>{pick.title}</Text>
                  </View>
                  <ReachPill deg={world.degreeToHost(pick.hostId)} />
                  <Text style={styles.panelRoute}>{routeSentence(pick.hostId)}</Text>
                  <Pressable style={styles.panelBtn} onPress={() => open(pick)}><Text style={styles.panelBtnText}>See how you're connected</Text></Pressable>
                </View>
              </>
            ) : (
              <Text style={styles.panelEmpty}>Pick a pin to see the home, the host, and how you reach them.</Text>
            )}
          </View>
        </View>
        <Text style={styles.mapCaption}>Drag to move, scroll to zoom. The ring is how close the host is to you, never a price.</Text>
        </View>
      )}
    </View>
  );
}

function routeSentence(hostId: string): string {
  const s = world.storyFor(hostId);
  if (!s.reachable) return `${world.memberById(hostId).name} is new to your circle.`;
  if (s.degrees === 1) return `You know ${world.memberById(hostId).name} directly.`;
  return `Through ${s.path[1]?.name}${s.path.length > 3 ? ' and others' : ''}.`;
}

function WebListingCard({ listing, onPress }: { listing: Listing; onPress: () => void }) {
  const host = world.hostOf(listing);
  const deg = world.degreeToHost(listing.hostId);
  return (
    <Pressable style={({ hovered }: any) => [styles.card, WEB_SHADOW, hovered && styles.cardHover]} onPress={onPress} accessibilityRole="button">
      <View style={styles.photoWrap}>
        <Image source={photoFor(listing.id)} style={styles.photo} resizeMode="cover" />
        <LinearGradient colors={['rgba(20,25,24,0)', 'rgba(20,25,24,0.42)']} style={StyleSheet.absoluteFill} />
        <View style={styles.kindPill}><Text style={styles.kindText}>{listing.kind}</Text></View>
        <View style={styles.hostRow}>
          <Avatar id={host.id} name={host.name} tint={host.avatarColor} country={host.country} size={26} ring />
          <Text style={styles.hostName}>{host.name}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardLine}>
          <Text style={styles.area}>{listing.area.split(',')[0]}</Text>
          <Text style={styles.price}>£{listing.pricePerNight} / night</Text>
        </View>
        <ReachPill deg={deg} />
        <Text style={styles.tags} numberOfLines={1}>{listing.tags.slice(0, 3).join(' · ')}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 30, fontWeight: '700', letterSpacing: -0.6, color: color.ink },
  sub: { fontSize: 14, color: color.inkFaint, marginTop: 4 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  vibeRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: -8 },
  vibeLabel: { fontSize: 12.5, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', color: color.inkFaint, marginRight: 2 },
  search: { flexGrow: 1, minWidth: 260, backgroundColor: color.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: color.hairline, paddingHorizontal: 20, paddingVertical: 13 },
  searchText: { fontSize: 14, color: color.inkFaint },
  segment: { flexDirection: 'row', backgroundColor: color.hairline, borderRadius: radius.pill, padding: 3 },
  segBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: radius.pill },
  segActive: { backgroundColor: color.surface },
  segText: { fontSize: 13, fontWeight: '700', color: color.inkFaint },
  segTextActive: { color: color.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  card: { width: 300, flexGrow: 1, maxWidth: 380, backgroundColor: color.surface, borderRadius: 20, overflow: 'hidden' },
  cardHover: { transform: [{ translateY: -3 }] },
  photoWrap: { height: 168, justifyContent: 'flex-end', backgroundColor: color.hairline },
  photo: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  kindPill: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  kindText: { fontSize: 11.5, fontWeight: '700', color: color.inkSoft },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  hostName: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', textShadowColor: 'rgba(20,25,24,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  cardBody: { padding: 14, gap: 8 },
  cardLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  area: { fontSize: 15.5, fontWeight: '700', color: color.ink },
  price: { fontSize: 14, fontWeight: '700', color: color.ink },
  tags: { fontSize: 12.5, color: color.inkFaint },
  empty: { paddingVertical: 60, alignItems: 'center', gap: 6 },
  emptyText: { fontSize: 17, fontWeight: '700', color: color.inkSoft },
  emptyHint: { fontSize: 13, color: color.inkFaint },
  clearBtn: { marginTop: 10, backgroundColor: color.brand, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 11 },
  clearBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  mapRow: { flexDirection: 'row', gap: 18, alignItems: 'flex-start' },
  mapCanvas: { flex: 1, borderRadius: 20, overflow: 'hidden' },
  mapPanel: { width: 340, backgroundColor: color.surface, borderRadius: 20, overflow: 'hidden' },
  mapCaption: { fontSize: 12.5, color: color.inkFaint, paddingHorizontal: 2 },
  panelPhoto: { width: '100%', height: 180 },
  panelBody: { padding: 16, gap: 10 },
  panelHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  panelName: { fontSize: 16, fontWeight: '700', color: color.ink },
  panelRoute: { fontSize: 13.5, color: color.inkSoft },
  panelBtn: { backgroundColor: color.brand, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  panelBtnText: { color: '#FFFFFF', fontSize: 14.5, fontWeight: '700' },
  panelEmpty: { padding: 20, fontSize: 14, color: color.inkFaint, lineHeight: 21 },
});
