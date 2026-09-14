// Expo Metro config for a pnpm monorepo: watch the whole repo and resolve modules from both the
// app and the hoisted root node_modules.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

// Honour package "exports" maps so ESM deps (superjson → copy-anything/is-what) and our
// workspace subpath exports (@kiki/api/contract) resolve correctly.
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
