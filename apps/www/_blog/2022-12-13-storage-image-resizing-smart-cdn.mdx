---
title: 'Supabase Storage v2: Image resizing and Smart CDN'
description: "We're introducing new features for Supabase Storage: Image resizing and a Smart CDN."
author: fabrizio,inian
imgSocial: lw6-storage/Image-resizing.jpg
imgThumb: lw6-storage/Image-resizing.jpg
categories:
  - product
tags:
  - launch-week
  - storage
date: '2022-12-13'
toc_depth: 3
video: https://www.youtube.com/v/NpEl20iuOtg
youtubeHero: https://www.youtube-nocookie.com/embed/NpEl20iuOtg
---

Today we're introducing three new features for Supabase Storage: Image resizing, webhooks, and a Smart CDN.

These features are designed to work together to deliver a next-gen image resizing system. Let's explore how it works.

<div className="bg-gray-300 rounded-lg px-6 py-2 italic">

🆕 What is new in Storage: [Supabase Storage v3: Resumable Uploads with support for 50GB files](https://supabase.com/blog/storage-v3-resumable-uploads)

</div>

## Image resizing

Image resizing has been a popular request since we released Supabase Storage. For good reason - if you're providing an image upload function to your users, you can't expect them to optimize the images before uploading.

Supabase developers have been hacking together all sorts of workarounds using client-side compression, or external providers like Cloudinary and Imgix.

Today's release changes that. Resizing is now as easy as adding a few lines of code:

```js
supabase.storage.from('bucket').getPublicUrl('image.jpg', {
  transform: {
    width: 500,
    height: 600,
  },
})
```

### Choosing a resizer

Supabase Storage uses [imgproxy](https://github.com/imgproxy/imgproxy). As usual, we assessed various open source tools available, including [Imaginary](https://github.com/h2non/imaginary) (MIT) and [Sharp](https://github.com/lovell/sharp) (Apache2).

All of these have very friendly open source licenses for self-hosting, so ultimately it came down to features and performance.

While Imaginary doesn't support some modern image formats yet (like AVIF), Sharp and imgproxy are both very feature-complete and well-maintained

In a head-to-head benchmark, we found the performance to be almost identical, with the deciding factor instead coming down to resources.

### Developer Experience

We spent a long time considering what a good developer experience would be for image resizing.

![Resizing sane defaults](/images/blog/launch-week-6/day-2-storage-resize/resize.png)

We landed on a simple, on-demand interface. Downloading a resized image in JavaScript looks like this:

```jsx
supabase.storage.from('bucket').download('image.jpg', {
  transform: {
    width: 800,
    height: 300,
    resize: 'contain', // 'contain' | 'cover' | 'fill'
  },
})
```

Or you can make a direct request to the Storage API (see `width` and `height` params):

```bash
GET https://project_id.supabase.co/storage/v1/render/image/public/bucket/image.jpg?width=500&height=600
```

If you've never used a resizing service before, you might be interested to learn that there are various approaches. Some services require you to resize your images “server side” before you can download them in the browser. Other services allow you to resize directly from the client. We opted for this client-based approach. It feels more developer friendly.

We might _additionally_ launch server-side presets as we add transformations because they provide a good DX for chaining multiple transformations (resize, rotate, and watermark for example). With server-side presets, transformations can be bundled together into a single command - `?preset=profile` instead of adding `?width=200&rotate=90&watermark=image` to all your image URLs.

Behind the scenes, we've provided a few small niceties:

- **No footguns:** an image will never be resized bigger than original dimensions (even if the user specifies larger dimensions)
- **Sane defaults:** default mode maintains aspect ratio and the resize mode is `cover`
- **Standardization**: resize modes mirror the [object-fit](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit) property of CSS. We support the contain, cover and fill modes.

<div className="bg-gray-300 rounded-lg p-6 italic">

Image Resizing is in Beta. While in Beta, it is only enabled for Pro Plan and Enterprise customers.

</div>

## Smart CDN

Resizing images can get expensive, so before this release we knew we needed a better caching system. We already provide a “basic” CDN for all projects (including Free Plan), so the important update here is some smarter cache invalidation whenever there are changes.

![Caching is hard](/images/blog/launch-week-6/day-2-storage-resize/caching.png)

Our Basic CDN works by adding a 1-hour cache header to every request. After this header expires, we re-check the origin (S3), to see if an image is still available. This parameter is configurable (for example, you can make it one day, or one year).

This approach introduces the possibility of a “stale” image. If you update an image in S3, users will continue to see the old, stale image for one hour. Similarly for deleted images - the cache will continue serving the deleted image until the cache expires.

With this release we're introducing a Smart CDN. Whenever you update or delete an image, the cache will be busted within 60 seconds - for every region in the world.

As a developer, you no longer need to worry about adjusting your cache parameters - the cache “just works”.

If you're interested in _how_ the cache works, see the deep-dive later in this blog post.

## Webhooks + Rate-limiting

As a “pre-release”, we've added webhooks and rate-limiting to the Storage API. We haven't exposed these parameters on our platform yet, but they are coming soon.

If you're self-hosting then you can use them today. It's as simple as enabling a few environment variables.

The webhook events we added are:

```bash
ObjectCreated:Post       # A new object is created
ObjectCreated:Put        # A new object is updated
ObjectCreated:Copy       # An object is duplicated
ObjectCreated:Move       # An object is created as part of a move operation
ObjectRemoved:Delete     # An object is deleted
ObjectRemoved:Move       # An object is deleted as part of a move operation
ObjectUpdated:Metadata   # An object's metadata is updated
```

## Smart CDN Deep Dive

Let's put everything together to see how the new Smart CDN works with Imgproxy.

Some developers have a high “resize” workload, and some have a high “read” workload. This means that there are different scaling requirements for every developer. As a result, we kept the image resizer and the Storage API as two separate containers. This allows them to scale independently depending on your workload.

Let's step through a few different flows to see how it all works:

- Cache miss: the image has never been resized
- Cache hit: the image has been resized and is stored in the cache
- Cache refresh: an image is updated/deleted and the CDN needs to be updated

### Cache miss

Let's imagine one of your users makes a request for a resized cat (kitten?) image in your application. Here's the flow:

![Cache miss flow](/images/blog/launch-week-6/day-2-storage-resize/cache-miss.png)

1. The request hits our globally-distributed API Gateway. This gateway reads the image metadata from a global KV store (this metadata is created when the image was uploaded).
2. Inside the image metadata is a Cache Key - this is comprised of an [Etag](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag) + tenant ID + bucketname + image name. The Gateway tries to find a cached object in our CDN using the Cache Key. If the image has never been accessed, it is a “Cache miss”.
3. The request falls back to the Storage server. Because this is a resize request, it is forwards a short-lived S3 URL to Imgproxy.
4. Imgproxy resizes the image and returns it to the Storage Server which in then returns it to the API Gateway, with stores it in the Cache (which means that the next time the Etag is checked, the result will return directly from the cache).

### Cache hit

The cat image goes viral, and so now multiple users want to see the resized image.

![Cache hit flow](/images/blog/launch-week-6/day-2-storage-resize/cache-hit.png)

1. The request hits our globally-distributed API Gateway. This gateway reads the image metadata from a global KV store.
2. Using the Cache Key the Gateway tries to find a cached object in our CDN. Because this image has already been resized, it returns it directly from the cache.

### Cache refresh

To complete this architecture, we need to keep the global KV store (which stores the image metadata) synchronized whenever an image is changed. To avoid coupling any CDN-specific logic into the Storage server, we added Webhooks that publish events for every object created, updated and deleted.

Using our cat picture from above:

![Cache refresh flow](/images/blog/launch-week-6/day-2-storage-resize/cache-refresh.png)

1. You update the cat picture to a dog picture. This triggers an `ObjectCreated:Put` event from the Supabase Storage server.
2. A cache manager service subscribes to these events and updates the global metadata store with the new Etag. This takes around 60 seconds to propagate globally.
3. The next time there is a request for the resized image, it will be a cache miss.

Most CDNs offer this functionality “natively”. However there is usually a hard-limit to the number of daily cache purges. This implementation gives us greater control over when the cache is cleared.

### The impact

Besides solving issues with stale data, one of the biggest benefits this architecture offers is higher cache hits. Why is that important? Because image resizing is slow. Every cache miss is increased latency for your users.

![Cache hit improvement](/images/blog/launch-week-6/day-2-storage-resize/hit%20rate%20improvement.png)

The green line here shows the number of cache hits to our CDN. As you can see, when we enabled the Smart CDN, the number of requests cache hits increased significantly (which means faster cat images).

## Availability and Pricing

Image Resizing is in Beta. While in Beta, it is only enabled for Pro Plan and Enterprise customers.

When choosing a pricing model there were a few options that competitors offered:

- Pay for every transformation, but don't pay for a CDN hit
- Don't pay for transformations, but pay for every request (even if it's a CDN hit)

We tried to find a middle ground, where you pay for the number of images you want to transform rather than the number of transformations:

- You can transform 100 images per project, at no additional cost. Beyond this, it is $5 per additional 1000 images transformed.
- Each image can be transformed up to 20 times. This is based on fair-usage. If you exceed the limit, we won't return an error and your site will continue to function (but you will get a sternly-worded email from [@AntWilson](https://twitter.com/AntWilson)).

Of course, all of this functionality is free in the self-hosting setup too. You can self-host the Storage API either as a standalone service or as part of the Supabase stack.

For local development, this is available in our CLI from v1.23.0.

Upgrade to supabase-js v2.2.0.

## Coming soon

A few features to look out for in the future:

- **Webhooks**: we'll expose all Storage webhooks and events so that you can consume them from your own services.
- **More Transformations**: quality, rotate, blur? Cast your vote on [this GitHub Discussion](https://github.com/supabase/supabase/discussions/10918).
- **Integrations**: Native integration with [next/image](https://nextjs.org/docs/api-reference/next/image) and [Edge Functions](https://supabase.com/edge-functions) for advanced transformations.

## Getting started

[Upgrade to Pro](https://supabase.com/pricing) to get started with Image Resizing today.

- Check out the Docs for [Image Resizing](https://supabase.com/docs/guides/storage/serving/image-transformations).
- Check out the Docs for the [Storage CDN](https://supabase.com/docs/guides/storage/cdn/fundamentals).
- Get Started today with the [JavaScript](https://supabase.com/docs/reference/javascript/storage-from-download) and [Dart](https://supabase.com/docs/reference/dart/storage-from-list) client libraries.

## More Launch Week 6

- [Day 1: New Supabase Docs, built with Next.js](https://supabase.com/blog/new-supabase-docs-built-with-nextjs)
- [Day 3: Multi-factor Authentication via Row Level Security Enforcement](https://supabase.com/blog/mfa-auth-via-rls)
- [Day 4: Supabase Wrappers, a Postgres FDW framework written in Rust](https://supabase.com/blog/postgres-foreign-data-wrappers-rust)
- [Day 5: Supabase Vault is now in Beta](https://supabase.com/blog/vault-now-in-beta)
- [Community Day](https://supabase.com/blog/launch-week-6-community-day)
- [Point in Time Recovery is now available](https://supabase.com/blog/postgres-point-in-time-recovery)
- [Custom Domain Names are now available](https://supabase.com/blog/custom-domain-names)
- [Wrap Up: everything we shipped](https://supabase.com/blog/launch-week-6-wrap-up)
