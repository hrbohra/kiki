import { useEffect, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { MapCanvas } from '../ui/MapCanvas';
import { ListingPreview } from '../ui/ListingPreview';
import { ListingCard } from '../ui/ListingCard';
import { Chip } from '../ui/Chip';
import { color, font, radius, space } from '../theme/tokens';
import { availableTags } from '../domain/fixtures';
import { useSession } from '../api/session';
import type { Listing, Member, ConnectionStory } from '../domain/types';
import type { RootNav } from '../navigation';

type Kind = 'All' | 'Room' | 'Whole place';
type ViewMode = 'homes' | 'map';

interface FeedItem {
  listing: Listing;
  host: Member;
  story: ConnectionStory;
  degrees: number;
}

/** Browse Kikis as a connection-sorted list or on the bespoke map — data from the live API. */
export function ExploreScreen() {
  const navigation = useNavigation<RootNav>();
  const { api } = useSession();
  const [feed, setFeed] = useState<FeedItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [mode, setMode] = useState<ViewMode>('homes');
  const [kind, setKind] = useState<Kind>('All');
  const [tags, setTags] = useState<Set<string>>(new Set());
  const [connectedOnly, setConnectedOnly] = useState(false);
  const [selected, setSelected] = useState<Listing | null>(null);

  useEffect(() => {
    let alive = true;
    api.listings.byDegree
      .query()
      .then((rows) => alive && setFeed(rows as FeedItem[]))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [api]);

  const toggleTag = (t: string) =>
    setTags((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });

  const degreeOf = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of feed ?? []) m.set(it.host.id, it.degrees);
    return (hostId: string) => m.get(hostId) ?? Infinity;
  }, [feed]);

  const items = useMemo(() => {
    const rows = (feed ?? []).filter((it) => {
      if (kind !== 'All' && it.listing.kind !== kind) return false;
      if (connectedOnly && !Number.isFinite(it.degrees)) return false;
      for (const t of tags) if (!it.listing.tags.includes(t)) return false;
      return true;
    });
    return [...rows].sort((a, b) => a.degrees - b.degrees);
  }, [feed, kind, tags, connectedOnly]);

  const listings = useMemo(() => items.map((it) => it.listing), [items]);
  const itemByListing = useMemo(() => {
    const m = new Map<string, FeedItem>();
    for (const it of items) m.set(it.listing.id, it);
    return m;
  }, [items]);

  const visibleSelected = selected && itemByListing.has(selected.id) ? selected : null;

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

      {feed === null ? (
        failed ? <ErrorState /> : <LoadingState />
      ) : mode === 'homes' ? (
        items.length > 0 ? (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {items.map((it) => (
              <ListingCard
                key={it.listing.id}
                listing={it.listing}
                host={it.host}
                story={it.story}
                onOpen={() => navigation.navigate('HostProfile', { listingId: it.listing.id })}
              />
            ))}
          </ScrollView>
        ) : (
          <EmptyState />
        )
      ) : (
        <View style={styles.mapWrap}>
          {listings.length > 0 ? (
            <MapCanvas listings={listings} selectedId={visibleSelected?.id ?? null} degreeForHost={degreeOf} onSelect={setSelected} />
          ) : (
            <EmptyState />
          )}
          {visibleSelected && itemByListing.get(visibleSelected.id) ? (
            <View style={styles.sheet} pointerEvents="box-none">
              <ListingPreview
                listing={visibleSelected}
                host={itemByListing.get(visibleSelected.id)!.host}
                story={itemByListing.get(visibleSelected.id)!.story}
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

function LoadingState() {
  return (
    <View style={styles.empty}>
      <ActivityIndicator color={color.brand} />
      <Text style={styles.emptyHint}>Finding homes near you…</Text>
    </View>
  );
}

function ErrorState() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>Couldn't reach the server.</Text>
      <Text style={styles.emptyHint}>Check the API is running and reload.</Text>
    </View>
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
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { ...font.h3, color: color.inkSoft },
  emptyHint: { ...font.caption },
});
