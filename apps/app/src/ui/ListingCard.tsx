import { useState } from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { Halo } from './motion';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from './Avatar';
import { PressableScale } from './PressableScale';
import { TrustPill } from './TrustPill';
import { Loop } from './Loop';
import { TRAIT_GLYPH } from './glyphs';
import { photoFor } from './listingPhotos';
import { color, font, radius, space, shadow } from '../theme/tokens';
import type { ConnectionStory, Listing, Member } from '../domain/types';

interface Props {
  listing: Listing;
  host: Member;
  story: ConnectionStory;
  onOpen: () => void;
}

/**
 * The Homes-list card. The trust strip sits between the home and the price on every card, so
 * the reason to trust is never something you scroll to find. Image is a gradient placeholder
 * with the Loop watermark (no photography).
 */
export function ListingCard({ listing, host, story, onOpen }: Props) {
  const [saved, setSaved] = useState(false);
  const mutual = story.reachable && story.path.length > 2 ? story.path[1] : null;
  const stripPerson = mutual ?? host;
  const stripText = !story.reachable
    ? `${host.name} is new to your circle`
    : mutual
      ? `Vouched for by ${mutual.name}`
      : `You know ${host.name} directly`;

  return (
    <PressableScale
      onPress={onOpen}
      accessibilityRole="button"
      style={[styles.card, shadow.card]}
    >
      <View style={styles.header}>
        <Halo on={story.reachable && story.degrees === 1} size={46}>
          <Avatar id={host.id} name={host.name} tint={host.avatarColor} country={host.country} size={46} />
        </Halo>
        <View style={styles.headMeta}>
          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.area}>{listing.area}</Text>
        </View>
        <Pressable onPress={() => setSaved((s) => !s)} hitSlop={12} style={styles.heart} accessibilityRole="button" accessibilityLabel="Save">
          <Text style={{ fontSize: 20, color: saved ? color.heart : color.inkFaint }}>{saved ? '♥' : '♡'}</Text>
        </Pressable>
      </View>

      <View style={[styles.image, { backgroundColor: listing.photoColor }]}>
        <Image source={photoFor(listing.id)} style={[StyleSheet.absoluteFill, styles.fill]} resizeMode="cover" accessibilityLabel={`${listing.title} — ${host.name}'s place in ${listing.area}`} />
        <LinearGradient colors={['rgba(20,25,24,0)', 'rgba(20,25,24,0.5)']} style={StyleSheet.absoluteFill} />
        <View style={styles.watermark}>
          <Loop size={110} color="#FFFFFF" opacity={0.32} strokeWidth={6} />
        </View>
        <View style={styles.imagePills}>
          <View style={styles.imagePill}><Text style={styles.pillKind}>{listing.kind}</Text></View>
          <View style={styles.imagePill}><Text style={styles.pillPrice}>£{listing.pricePerWeek} / week</Text></View>
        </View>
        <Text style={styles.tagLine} numberOfLines={1}>{listing.tags.slice(0, 3).join('  ·  ')}</Text>
      </View>

      <View style={styles.strip}>
        <Avatar id={stripPerson.id} name={stripPerson.name} tint={stripPerson.avatarColor} country={stripPerson.country} size={24} />
        <Text style={styles.stripText} numberOfLines={1}>{stripText}</Text>
        {story.reachable ? <TrustPill label={`${ordinal(story.degrees)} degree`} tone="outline" /> : null}
      </View>

      {story.overlaps[0] ? (() => {
        const G = TRAIT_GLYPH[story.overlaps[0].kind];
        return (
          <View style={styles.overlapRow}>
            <G size={15} color={color.inkSoft} accent={color.brand} />
            <Text style={styles.overlap} numberOfLines={1}>{story.overlaps[0].label}</Text>
          </View>
        );
      })() : null}
    </PressableScale>
  );
}

function ordinal(n: number): string {
  return n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`;
}

const styles = StyleSheet.create({
  card: { backgroundColor: color.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: color.hairline, padding: space.card, gap: space.md },
  pressed: { opacity: 0.96, transform: [{ scale: 0.995 }] },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  headMeta: { flex: 1 },
  title: { ...font.title },
  area: { ...font.caption, marginTop: 2 },
  heart: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  image: { height: 172, borderRadius: radius.lg, overflow: 'hidden', justifyContent: 'flex-start' },
  fill: { width: '100%', height: '100%' },
  watermark: { position: 'absolute', right: -10, bottom: -10 },
  imagePills: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', gap: 6 },
  imagePill: { backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  pillKind: { fontSize: 12, fontWeight: '700', color: color.inkSoft },
  pillPrice: { fontSize: 12, fontWeight: '700', color: color.ink },
  tagLine: { position: 'absolute', bottom: 12, left: 12, right: 12, fontSize: 12, fontWeight: '700', color: '#FFFFFF', textShadowColor: 'rgba(31,41,43,0.45)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  strip: { flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: color.brandTint, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: 10 },
  stripText: { flex: 1, fontSize: 13, fontWeight: '700', color: color.textOnMint },
  overlapRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  overlap: { fontSize: 13, fontWeight: '600', color: color.inkSoft, flex: 1 },
});
