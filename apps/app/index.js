import { registerRootComponent } from 'expo';
import App from './App';

// Monorepo-friendly entry (avoids the node_modules/expo/AppEntry path under hoisting).
registerRootComponent(App);
