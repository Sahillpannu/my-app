// Custom entry point. Replaces the default "expo-router/entry" main field
// so polyfills.js runs before Supabase and other dependencies load.
//
// polyfills.js is also registered in metro.config.js getModulesRunBeforeMainModule
// so it runs before React Native InitializeCore (which loads whatwg-fetch).

import './polyfills';
import 'expo-router/entry';

// #region agent log
fetch('http://127.0.0.1:7660/ingest/e27dba7b-1552-45ae-bf9c-c515a1e63edb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'2c8364'},body:JSON.stringify({sessionId:'2c8364',location:'index.js:11',message:'index.js loaded after InitializeCore',data:{polyfills:global.__agentDebug||null,hasDOMException:typeof globalThis.DOMException==='function',hasFetch:typeof globalThis.fetch==='function',hasPerformanceEntry:typeof globalThis.PerformanceEntry!=='undefined',hasPerformance:typeof globalThis.performance!=='undefined',bundleHasPrivateFields:false},timestamp:Date.now(),hypothesisId:'H5',runId:'post-fix-v2'})}).catch(function(){});
// #endregion
