const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// FIX 0 — DOMException polyfill must run BEFORE InitializeCore
// Expo's getModulesRunBeforeMainModule runs InitializeCore before index.js.
// InitializeCore → setUpXHR → whatwg-fetch reads globalThis.DOMException at
// module load time, which Hermes does not provide — causing a boot crash.
// Prepend polyfills.js so it executes before InitializeCore, not after.
const defaultGetModulesRunBeforeMainModule =
  config.serializer?.getModulesRunBeforeMainModule;

config.serializer = {
  ...config.serializer,
  getModulesRunBeforeMainModule: () => {
    const defaultModules =
      typeof defaultGetModulesRunBeforeMainModule === 'function'
        ? defaultGetModulesRunBeforeMainModule()
        : [];
    return [path.resolve(__dirname, 'polyfills.js'), ...defaultModules];
  },
};

// FIX 1 — unstable_enablePackageExports = false
// Prevents Metro from following the "exports" field in package.json when resolving modules.
// Without this, Metro resolves Supabase's realtime client → ws → a Node-only build that
// ships private class fields (#property syntax) Hermes cannot parse.
// DO NOT REMOVE — removing this causes: "private properties are not supported" crash on boot.
config.resolver.unstable_enablePackageExports = false;

// FIX 2 — cross-fetch shim
// Supabase's realtime client pulls in `cross-fetch` transitively. cross-fetch's browser/Node
// build references DOMException, fetch, Headers, Request, and Response as browser globals,
// none of which exist in React Native's Hermes engine.
// This redirects every require('cross-fetch') to a local shim (shims/cross-fetch.js) that
// re-exports React Native's native fetch globals and polyfills DOMException safely.
// DO NOT REMOVE — removing this causes: "DOMException is not defined" crash on Supabase init.
config.resolver.extraNodeModules = {
  'cross-fetch': path.resolve(__dirname, 'shims/cross-fetch.js'),
};

module.exports = config;


