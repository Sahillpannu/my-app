// Shim for the `cross-fetch` module, which Supabase's realtime client
// pulls in transitively. cross-fetch's Node/browser build references
// `DOMException`, `fetch`, `Headers`, `Request`, and `Response` as
// browser globals — none of which exist in React Native's Hermes engine.
//
// This shim registers a safe DOMException fallback and re-exports
// React Native's own native fetch implementation instead of trying
// to load cross-fetch's actual (browser-targeted) code.

try {
  if (typeof global.DOMException === 'undefined') {
    global.DOMException = class DOMException extends Error {
      constructor(message, name) {
        super(message);
        this.name = name || 'DOMException';
      }
    };
  }
  if (typeof globalThis.DOMException === 'undefined') {
    globalThis.DOMException = global.DOMException;
  }
} catch (e) {
  // If global/globalThis aren't writable for some reason, fail silently
  // rather than crashing app boot over a polyfill.
}

module.exports = {
  fetch: global.fetch,
  Headers: global.Headers,
  Request: global.Request,
  Response: global.Response,
  default: global.fetch,
};
