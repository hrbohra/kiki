import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { avatarGradient, gradientStart, gradientEnd, color, flagOf } from '../theme/tokens';
import { avatarPhotoFor } from './avatarPhotos';

interface Props {
  name: string;
  tint: string;
  country?: string;
  size?: number;
  ring?: boolean; // white border, for overlapping chains / graph nodes
  id?: string; // member id; if it has a portrait, the photo is used instead of the monogram
}

/**
 * A member avatar: a real portrait when one exists for `id`, otherwise a gradient monogram
 * (a two-stop diagonal gradient of the member's hue with a white initial). Either way it can
 * carry a nationality-flag badge and an optional white ring, matching Kiki's listing avatars.
 */
export function Avatar({ name, tint, country, size = 44, ring = false, id }: Props) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const badge = Math.max(17, size * 0.4);
  const photo = avatarPhotoFor(id);

  return (
    <View style={{ width: size, height: size }}>
      {photo ? (
        <Image
          source={photo}
          resizeMode="cover"
          style={[{ width: size, height: size, borderRadius: size / 2 }, ring && styles.ring]}
        />
      ) : (
        <LinearGradient
          colors={avatarGradient(tint)}
          start={gradientStart}
          end={gradientEnd}
          style={[styles.disc, { width: size, height: size, borderRadius: size / 2 }, ring && styles.ring]}
        >
          <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
        </LinearGradient>
      )}
      {country ? (
        <View style={[styles.flagBadge, { width: badge, height: badge, borderRadius: badge / 2 }]}>
          <Text style={{ fontSize: badge * 0.62 }}>{flagOf(country)}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  disc: { alignItems: 'center', justifyContent: 'center' },
  ring: { borderWidth: 3, borderColor: color.surface },
  initial: { color: '#FFFFFF', fontWeight: '800' },
  flagBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});
