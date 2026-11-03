// Metro config for an Expo app inside an npm-workspaces monorepo.
// The native `android/` and `ios/` folders are committed, but Metro still needs
// to watch the workspace root so changes in packages/* trigger fast refresh.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Workspace packages are hoisted to the root node_modules, so hierarchical
// lookup from apps/mobile would miss them.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
