import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Avatar } from './Avatar';
import { TrustPill } from './TrustPill';
import { Loop } from './Loop';
import { color, font, radius, space, shadow } from '../theme/tokens';
import type { ConnectionStory, Listing, Member } from '../domain/types';

interface Props {
  listing: Listing;
  host: Member;
  story: ConnectionStory;
  onOpen: () => void;
}

/** The card that floats over the map on pin tap: listing + a trust banner + a payoff CTA. */
export function ListingPreview({ listing, host, story, onOpen }: Props) {
  const mutual = story.reachable && story.path.length > 2 ? story.path[1].name : null;
  const bannerText = !story.reachable
    ? `${host.name} is new to your circle`
    : story.overlaps[0]
      ? story.overlaps[0].label + (mutual ? ` · via ${mutual}` : '')
      : mutual
        ? `Vouched through ${mutual}`
        : `You know ${host.name} directly`;

  return (
    <View style={[styles.card, shadow.raised]}>
      <View style={styles.header}>
        <Avatar id={host.id} name={host.name} tint={host.avatarColor} country={host.country} size={48} />
        <View style={styles.headMeta}>
          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.area}>{listing.area} · £{listing.pricePerWeek}/week</Text>
        </View>
        {story.reachable ? <TrustPill label={`${ordinal(story.degrees)} degree`} tone="tint" /> : null}
      </View>

      <View style={styles.banner}>
        <Loop size={26} color={color.brandDark} opacity={0.9} strokeWidth={7} />
        <Text style={styles.bannerText} numberOfLines={2}>{bannerText}</Text>
      </View>

      <Pressable style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]} onPress={onOpen} accessibilityRole="button">
        <Text style={styles.ctaText}>See how you're connected</Text>
      </Pressable>
    </View>
  );
}

function ordinal(n: number): string {
  return n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`;
}

const styles = StyleSheet.create({
  card: { backgroundColor: color.surface, borderRadius: radius.xl, padding: space.card, gap: space.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  headMeta: { flex: 1 },
  title: { ...font.h3 },
  area: { ...font.caption, marginTop: 2 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: color.brandTint,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
  },
  bannerText: { flex: 1, fontSize: 13, fontWeight: '600', color: color.textOnMint, lineHeight: 18 },
  cta: { backgroundColor: color.brand, borderRadius: radius.md, paddingVertical: 13, alignItems: 'center', ...shadow.brand },
  ctaPressed: { backgroundColor: color.brandDark },
  ctaText: { ...font.button },
});
