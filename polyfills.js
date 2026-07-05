// This file MUST run before React Native's InitializeCore (which loads whatwg-fetch).
// Expo registers InitializeCore in Metro's getModulesRunBeforeMainModule — BEFORE
// the app entry (index.js). A polyfill imported only from index.js is too late.
//
// DO NOT use fetch() or `class X extends Error` here — fetch is not installed until
// InitializeCore runs, and Hermes rejects Babel's class-extends transform.
//
// DO NOT REMOVE OR REORDER — metro.config.js prepends this module ahead of InitializeCore.

var needsPolyfill = true;
try {
  needsPolyfill = typeof globalThis.DOMException !== 'function';
} catch {
  needsPolyfill = true;
}

if (needsPolyfill) {
  // Function declaration (not class/extends) — matches whatwg-fetch fallback pattern.
  function DOMException(message, name) {
    this.message = message === undefined ? '' : String(message);
    this.name = name === undefined ? 'Error' : String(name);
    var error = Error(this.message);
    this.stack = error.stack;
  }
  DOMException.prototype = Object.create(Error.prototype);
  DOMException.prototype.constructor = DOMException;

  var targets = [];
  if (typeof globalThis !== 'undefined') targets.push(globalThis);
  if (typeof global !== 'undefined' && targets.indexOf(global) === -1) {
    targets.push(global);
  }

  for (var i = 0; i < targets.length; i++) {
    var g = targets[i];
    try {
      Object.defineProperty(g, 'DOMException', {
        value: DOMException,
        writable: true,
        configurable: true,
      });
    } catch {
      g.DOMException = DOMException;
    }
  }

  // #region agent log
  global.__agentDebug = {
    polyfillsRan: true,
    needsPolyfill: true,
    hasDOMException: typeof globalThis.DOMException === 'function',
    hasPerformanceEntry: typeof globalThis.PerformanceEntry !== 'undefined',
    hasPerformance: typeof globalThis.performance !== 'undefined',
    hasFetch: typeof globalThis.fetch === 'function',
  };
  // #endregion
}

// #region agent log
if (!needsPolyfill) {
  global.__agentDebug = {
    polyfillsRan: true,
    needsPolyfill: false,
    hasPerformanceEntry: typeof globalThis.PerformanceEntry !== 'undefined',
  };
}
// #endregion
