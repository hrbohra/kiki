import { useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import { MapCanvas } from '../ui/MapCanvas';
import { ListingPreview } from '../ui/ListingPreview';
import { ListingCard } from '../ui/ListingCard';
import { Chip } from '../ui/Chip';
import { color, font, radius, space } from '../theme/tokens';
import { availableTags } from '../domain/fixtures';
import * as world from '../world';
import { useWorldVersion } from '../api/world-provider';
import type { Listing } from '../domain/types';
import type { RootNav } from '../navigation';

type Kind = 'All' | 'Room' | 'Whole place';
type ViewMode = 'homes' | 'map';

/** Browse Kikis as a connection-sorted list or on the bespoke map — data from the live world snapshot. */
export function ExploreScreen() {
  const navigation = useNavigation<RootNav>();
  const version = useWorldVersion(); // re-render when the world refreshes
  const [mode, setMode] = useState<ViewMode>('homes');
  const [kind, setKind] = useState<Kind>('All');
  const [tags, setTags] = useState<Set<string>>(new Set());
  const [connectedOnly, setConnectedOnly] = useState(false);
  const [selected, setSelected] = useState<Listing | null>(null);

  const toggleTag = (t: string) =>
    setTags((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });

  const listings = useMemo(() => {
    const filtered = world.allListings().filter((l) => {
      if (l.hostId === world.viewerId) return false; // don't show your own place
      if (kind !== 'All' && l.kind !== kind) return false;
      if (connectedOnly && !Number.isFinite(world.degreeToHost(l.hostId))) return false;
      for (const t of tags) if (!l.tags.includes(t)) return false;
      return true;
    });
    // Sort by closest connection — the most trustworthy home comes first, not the cheapest.
    return [...filtered].sort((a, b) => world.degreeToHost(a.hostId) - world.degreeToHost(b.hostId));
  }, [kind, tags, connectedOnly, version]);

  const visibleSelected = selected && listings.some((l) => l.id === selected.id) ? selected : null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.h1}>Explore</Text>
          <View style={styles.segment}>
            {(['homes', 'map'] as ViewMode[]).map((m) => (
              <Pressable key={m} onPress={() => setMode(m)} style={[styles.segBtn, mode === m && styles.segActive]}>
                <Text style={[styles.segText, mode === m && styles.segTextActive]}>{m === 'homes' ? 'Homes' : 'Map'}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.search}><Text style={styles.searchText}>🔍  Search by dates or duration</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          <Chip label="Connected" active={connectedOnly} onPress={() => setConnectedOnly((v) => !v)} />
          {(['All', 'Room', 'Whole place'] as Kind[]).map((k) => (
            <Chip key={k} label={k} active={kind === k} onPress={() => setKind(k)} />
          ))}
          <View style={styles.divider} />
          {availableTags.map((t) => (
            <Chip key={t} label={t} active={tags.has(t)} onPress={() => toggleTag(t)} />
          ))}
        </ScrollView>
      </View>

      {mode === 'homes' ? (
        listings.length > 0 ? (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {listings.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                host={world.hostOf(l)}
                story={world.storyFor(l.hostId)}
                onOpen={() => navigation.navigate('HostProfile', { listingId: l.id })}
              />
            ))}
          </ScrollView>
        ) : (
          <EmptyState />
        )
      ) : (
        <View style={styles.mapWrap}>
          {listings.length > 0 ? (
            <MapCanvas listings={listings} selectedId={visibleSelected?.id ?? null} degreeForHost={world.degreeToHost} onSelect={setSelected} />
          ) : (
            <EmptyState />
          )}
          {visibleSelected ? (
            <View style={styles.sheet} pointerEvents="box-none">
              <ListingPreview
                listing={visibleSelected}
                host={world.hostOf(visibleSelected)}
                story={world.storyFor(visibleSelected.hostId)}
                onOpen={() => navigation.navigate('HostProfile', { listingId: visibleSelected.id })}
              />
            </View>
          ) : listings.length > 0 ? (
            <View style={styles.hint} pointerEvents="none">
              <Text style={styles.hintText}>Tap a home to see how you're connected</Text>
            </View>
          ) : null}
        </View>
      )}
    </SafeAreaView>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>No homes match these filters yet.</Text>
      <Text style={styles.emptyHint}>Tap a filter above to widen your search.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.bg },
  header: { paddingTop: space.sm, paddingBottom: space.sm, gap: space.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.screen },
  h1: { ...font.display },
  segment: { flexDirection: 'row', backgroundColor: color.hairline, borderRadius: radius.pill, padding: 3 },
  segBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: radius.pill },
  segActive: { backgroundColor: color.surface },
  segText: { fontSize: 13, fontWeight: '700', color: color.inkFaint },
  segTextActive: { color: color.ink },
  search: { marginHorizontal: space.screen, backgroundColor: color.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: color.hairline, paddingHorizontal: space.lg, paddingVertical: 12 },
  searchText: { ...font.body, color: color.inkFaint },
  filters: { paddingHorizontal: space.screen, gap: space.sm, alignItems: 'center' },
  divider: { width: 1, height: 24, backgroundColor: color.hairline, marginHorizontal: 4 },
  list: { padding: space.screen, gap: space.md },
  mapWrap: { flex: 1 },
  sheet: { position: 'absolute', left: space.md, right: space.md, bottom: space.lg },
  hint: { position: 'absolute', left: 0, right: 0, bottom: space.xl, alignItems: 'center' },
  hintText: { ...font.caption, color: color.inkSoft, backgroundColor: color.surface, paddingHorizontal: space.lg, paddingVertical: space.sm, borderRadius: radius.pill, overflow: 'hidden' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  emptyText: { ...font.h3, color: color.inkSoft },
  emptyHint: { ...font.caption },
});
