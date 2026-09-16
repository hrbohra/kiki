import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { View, ActivityIndicator, Text, Pressable, StyleSheet } from 'react-native';
import type { WorldData } from '@kiki/domain';
import { useSession } from './session';
import { setWorldData, isReady } from '../world';
import { color, font, space } from '../theme/tokens';

interface WorldCtx {
  version: number;
  refresh: () => Promise<void>;
}

const Ctx = createContext<WorldCtx | null>(null);

/** Loads the world snapshot from the API once (per signed-in member) and feeds it into the world
 *  facade, then renders the app. `refresh()` re-pulls after a write so reads reflect it. */
export function WorldProvider({ children }: { children: ReactNode }) {
  const { api, signOut } = useSession();
  const [version, setVersion] = useState(0);
  const [ready, setReadyState] = useState(isReady());
  const [failed, setFailed] = useState(false);

  const refresh = useCallback(async () => {
    setFailed(false);
    try {
      // A stale token can leave the first load hanging; never let the splash be the last thing a visitor sees.
      const snap = await Promise.race([
        api.world.snapshot.query(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("snapshot timeout")), 12000)),
      ]);
      setWorldData(snap as WorldData);
      setReadyState(true);
      setVersion((v) => v + 1);
    } catch {
      setFailed(true);
    }
  }, [api]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!ready) {
    return (
      <View style={styles.splash}>
        {failed ? (
          <>
            <Text style={styles.msg}>Couldn't load your world.</Text>
            <Pressable onPress={() => void refresh()} style={styles.retry}><Text style={styles.retryText}>Retry</Text></Pressable>
            <Pressable onPress={() => { void signOut(); }} style={styles.retry}><Text style={styles.retryText}>Start over</Text></Pressable>
          </>
        ) : (
          <ActivityIndicator color={color.brand} />
        )}
      </View>
    );
  }

  return <Ctx.Provider value={{ version, refresh }}>{children}</Ctx.Provider>;
}

/** Re-pull the world (call after a mutation so reads update). */
export function useWorldRefresh(): () => Promise<void> {
  return useContext(Ctx)?.refresh ?? (async () => {});
}

/** Bumps whenever the world reloads — read it in a screen to re-render on refresh. */
export function useWorldVersion(): number {
  return useContext(Ctx)?.version ?? 0;
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg, gap: space.md },
  msg: { ...font.body, color: color.inkSoft },
  retry: { backgroundColor: color.brand, borderRadius: 999, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: '#fff', fontWeight: '700' },
});
