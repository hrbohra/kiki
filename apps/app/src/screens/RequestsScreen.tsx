import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RequestsWeb } from './web/RequestsWeb';
import { color } from '../theme/tokens';

/** Requests — the host's home screen. RequestsWeb already wraps its columns, so on a phone the
 *  request list and the norms rail simply stack. */
export function RequestsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <RequestsWeb />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.screen },
  body: { padding: 16, paddingBottom: 40 },
});
