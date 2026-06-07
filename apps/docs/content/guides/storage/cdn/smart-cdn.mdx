---
id: 'storage-cdn'
title: 'Smart CDN'
description: 'Learn how Supabase Storage caches objects with a CDN.'
sidebar_label: 'CDN'
---

With Smart CDN caching enabled, the asset metadata in your database is synchronized to the edge. This automatically revalidates the cache when the asset is changed or deleted.

Moreover, the Smart CDN achieves a greater cache hit rate by shielding the origin server from asset requests that remain unchanged, even when different query strings are used in the URL.

<Admonition type="note">

Smart CDN caching is automatically enabled for [Pro Plan and above](/pricing).

</Admonition>

## Cache duration

When Smart CDN is enabled, the asset is cached on the CDN for as long as possible. You can still control how long assets are stored in the browser using the [`cacheControl`](/docs/reference/javascript/storage-from-upload) option when uploading a file. Smart CDN caching works with all types of storage operations including signed URLs.

When a file is updated or deleted, the CDN cache is automatically invalidated to reflect the change (including transformed images). It can take **up to 60 seconds** for the CDN cache to be invalidated as the asset metadata has to propagate across all the data-centers around the globe.

When an asset is invalidated at the CDN level, browsers may not update its cache. This is where cache eviction comes into play.

## Cache eviction

Even when an asset is marked as invalidated at the CDN level, browsers may not refresh their cache for that asset.

If you have assets that undergo frequent updates, it is advisable to upload the new asset to a different path. This approach ensures that you always have the most up-to-date asset accessible.

If you anticipate that your asset might be deleted, it's advisable to set a shorter browser Time-to-Live (TTL) value using the `cacheControl` option. The default TTL is typically set to 1 hour, which is generally a reasonable default value.

## Bypassing cache

If you need to ensure assets refresh directly from the origin server and bypass the cache, you can achieve this by adding a unique query string such as `cacheNonce` to the URL.

For instance, you can use a URL like `/storage/v1/object/sign/profile-pictures/cat.jpg?cacheNonce=1` with a long browser cache (e.g., 1 year). To update the picture, increment the `cacheNonce` query parameter in the URL, like `/storage/v1/object/sign/profile-pictures/cat.jpg?cacheNonce=2`. The CDN will recognize it as a new object and fetch the updated version from the origin.

## Signed URLs and CDN caching

Signed URLs are the primary way to serve assets from private buckets to end users. With Smart CDN enabled, signed URL responses are cached at the CDN edge, just like any other storage request.

Unlike public bucket URLs, each signed URL contains a unique token query parameter (`?token=...`). Smart CDN treats each unique token as a separate cache key, meaning the first request with any given signed URL results in a cache miss, and only subsequent requests using that exact same URL will receive a cache hit. Two different signed URLs for the same object, even if generated seconds apart, each maintain their own independent cache entry.

This affects how you should think about serving private assets:

- If you generate a new signed URL on every request, the cache will never be warm and every request hits the origin.
- If you re-use the same signed URL across multiple requests, subsequent requests are served from cache. If the asset has no meaningful per-user access restriction, prefer a public bucket. It results in higher cache hit rates and removes the need to manage signed URL generation entirely.
- Revoking or expiring a token does not purge its CDN cache entry. The cached response persists at the edge until the cache duration expires.
- Deleting the object invalidates all cached entries for that object across all tokens. This can take up to a minute to propagate.

Token expiry (`expiresIn`) and the object's response cache TTL (`cacheControl`) are independent. Once a response is cached at the edge, that cached response can continue to be served for the same signed URL until the CDN cache duration expires, even if the token in that URL has already expired. If you need to cut off access to an asset, delete the object from the bucket rather than relying on token expiry alone.
