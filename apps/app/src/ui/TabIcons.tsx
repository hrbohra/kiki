import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

interface IconProps { color: string; size?: number }

const SW = 1.9;
const common = { stroke: undefined as unknown as string, strokeWidth: SW, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

/** Explore — magnifier. */
export function ExploreIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={11} cy={11} r={6} {...common} stroke={color} />
      <Line x1={20} y1={20} x2={15.5} y2={15.5} {...common} stroke={color} />
    </Svg>
  );
}

/** Community — two figures. */
export function CommunityIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={9} cy={8.5} r={3} {...common} stroke={color} />
      <Path d="M3.5 19 v-1 c0-2.5 2.2-4 5.5-4 s5.5 1.5 5.5 4 v1" {...common} stroke={color} />
      <Circle cx={17.5} cy={9.5} r={2.3} {...common} stroke={color} />
      <Path d="M16 14.2 c3 0 4.5 1.5 4.5 3.8 v1" {...common} stroke={color} />
    </Svg>
  );
}

/** Away — calendar. */
export function TripsIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={4} y={5} width={16} height={15} rx={2.5} {...common} stroke={color} />
      <Line x1={4} y1={9.5} x2={20} y2={9.5} {...common} stroke={color} />
      <Line x1={8} y1={3} x2={8} y2={6} {...common} stroke={color} />
      <Line x1={16} y1={3} x2={16} y2={6} {...common} stroke={color} />
    </Svg>
  );
}

/** Messages — speech bubble. */
export function MessagesIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 5 h14 a1.5 1.5 0 0 1 1.5 1.5 v8 a1.5 1.5 0 0 1 -1.5 1.5 H10 l-4 3 v-3 H5 a1.5 1.5 0 0 1 -1.5 -1.5 v-8 A1.5 1.5 0 0 1 5 5 z" {...common} stroke={color} />
    </Svg>
  );
}

/** Requests — an inbox tray. */
export function RequestsIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 13 h4 l1.5 2.5 h5 L16 13 h4" {...common} stroke={color} />
      <Path d="M4 13 l2.2-6.2 A2 2 0 0 1 8.1 5.5 h7.8 a2 2 0 0 1 1.9 1.3 L20 13 v4 a2 2 0 0 1 -2 2 H6 a2 2 0 0 1 -2 -2 z" {...common} stroke={color} />
    </Svg>
  );
}

/** Me — bust. */
export function MeIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={8} r={4} {...common} stroke={color} />
      <Path d="M4 20 c0-4 3.6-6 8-6 s8 2 8 6" {...common} stroke={color} />
    </Svg>
  );
}

export const TAB_ICON = {
  Explore: ExploreIcon,
  Requests: RequestsIcon,
  Community: CommunityIcon,
  Trips: TripsIcon,
  Messages: MessagesIcon,
  Me: MeIcon,
} as const;
