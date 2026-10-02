import { internals, primordials } from "ext:core/mod.js";
import * as webidl from "ext:deno_webidl/00_webidl.js";
import * as DenoCaches from "ext:deno_cache/01_cache.js";

const ALLOWED_CACHE_NAMES = ["transformers-cache"];
const {
  ObjectPrototypeIsPrototypeOf,
} = primordials;

async function open(cacheName, _next) {
  if (!ALLOWED_CACHE_NAMES.includes(cacheName)) {
    return await notAvailable();
  }

  // NOTE(kallebysantos): Since default `Web Cache` is not alloed we need to manually create a new
  // `Cache` instead of get it from `next()`. In a scenario where `Web Cache` is full allowed, the
  // `ai: Cache Adapter` should be used as composable middleware: const cache = await
  // next(cacheName);
  const cache = webidl.createBranded(DenoCaches.Cache);
  cache[Symbol("id")] = "ai_cache";

  const _cacheMatch = CachePrototype.match;

  cache.match = async function (args) {
    return await match(
      args,
      (interceptedArgs) => _cacheMatch.call(cache, interceptedArgs),
    );
  };

  return cache;
}

async function match(req, _next) {
  const requestUrl = ObjectPrototypeIsPrototypeOf(Request.prototype, req)
    ? req.url()
    : req;
  if (!URL.canParse(requestUrl)) {
    return undefined;
  }

  if (!requestUrl.includes("onnx")) {
    // NOTE(kallebysantos): Same ... from previous method, it should call `next()` in order to
    // continue the middleware flow.
    return undefined;
  }

  return new Response(requestUrl, { status: 200 });
}

const CacheStoragePrototype = DenoCaches.CacheStorage.prototype;
const CachePrototype = DenoCaches.Cache.prototype;

// TODO(kallebysantos): Refactor to an `applyInterceptor` function.
const _cacheStoragOpen = CacheStoragePrototype.open;
CacheStoragePrototype.open = async function (args) {
  return await open(
    args,
    (interceptedArgs) => _cacheStoragOpen.call(this, interceptedArgs),
  );
};

// NOTE(kallebysantos): Full `Web Cache API` is not allowed so we disable all other methods. In a
// scenario where `Web Cache` is free to use, the `ai: Cache Adapter` should act as request
// middleware ie. add new behaviour on top of `next()`
async function notAvailable() {
  // Ignore errors when `debug = true`
  if (internals, internals.bootstrapArgs.opts.debug) {
    return;
  }

  throw new Error("Web Cache is not available in this context");
}

CacheStoragePrototype.has = notAvailable;
CacheStoragePrototype.delete = notAvailable;
CachePrototype.delete = notAvailable;
CachePrototype.put = notAvailable;
CachePrototype[Symbol("matchAll")] = notAvailable;
