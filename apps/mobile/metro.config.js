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

// Workspace packages are symlinked into the root node_modules. Metro cannot
// follow that link on every platform, so point at the source directly. The
// folder has no package.json, which makes Metro pick up `index.ts` as the entry.
config.resolver.extraNodeModules = {
  '@salon/shared': path.resolve(workspaceRoot, 'packages/shared/src'),
};

// `packages/shared` is authored as NodeNext ESM, so its relative imports end in
// `.js` while the files on disk are `.ts`. TypeScript understands that, Metro
// does not, so drop the suffix for files that come from the shared package.
const sharedSrc = path.resolve(workspaceRoot, 'packages/shared/src');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const fromShared = (context.originModulePath ?? '').startsWith(sharedSrc);
  if (fromShared && moduleName.startsWith('.') && moduleName.endsWith('.js')) {
    moduleName = moduleName.slice(0, -3);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
