---
title: 'Supabase Storage now in Beta'
description: Supabase Storage moves into Beta.
author: inian
imgSocial: launch-week-sql-day-2/supabase-storage-beta-og.jpg
imgThumb: launch-week-sql-day-2/supabase-storage-beta.jpg
categories:
  - product
tags:
  - storage
  - launch-week
date: '2021-07-27'
toc_depth: 2
---

At Supabase, one of our core values is [Kaizen](https://en.wikipedia.org/wiki/Kaizen) - continuous improvement. And that's exactly what we've been doing with Storage since it [launched](/blog/2021/03/30/supabase-storage) three months ago. Today, we are launching the Sequel to Storage Alpha (I bet you didn't see that coming): Storage Beta!

## Streaming Media

We've added support for streaming audio and video files.

Clients can use the `Content-Range` HTTP header to request specific parts of a file from a server. This allows them to intelligently download the parts of the video that a user is viewing, without buffering irrelevant sections of the media file. Supabase Storage now supports this header, making it easier to host and watch [nyan cat videos](https://www.youtube.com/watch?v=SkgTxQm9DWM) all day long.

<video width="99%" autoPlay muted playsInline controls={true}>
  <source
    src="https://xguihxuzqibwxjnimxev.supabase.co/storage/v1/object/public/videos/marketing/blog/launch-week-storage-2/nyan-cat.mp4"
    type="video/mp4"
  />
</video>

## Public Buckets

Public Buckets have been one of our most requested features. We launched without them because there are too [many horror stories](https://www.google.com/search?q=s3+bucket+negligence+award&oq=s3+bucket+negligence+award) of S3 buckets unintentionally exposing objects. We wanted to take the time to implement safeguards against this.

To enable this feature safely, buckets are made private by default, with an extremely prominent warning in the dashboard when you choose to make them public.

You can make objects public in S3 via multiple mechanisms (e.g. tags, or prefixes). While this allows for flexibility, it makes it hard to discover publicly exposed objects. To prevent any confusion, we decided that buckets must be public in their entirety. This public visibility is straightforward - if it's in a public bucket, it's public!

Objects in public buckets can be accessed via a URL without any Authorization tokens or headers. This makes them perfect for hosting assets for your web or mobile application.

Public buckets still require [Auth Policies](/docs/guides/storage/security/access-control#policy-examples) to upload and delete objects, allowing you to securely manage their contents.

<video width="99%" autoPlay muted playsInline controls={true}>
  <source src="/images/blog/2021-june/public-buckets.mp4" type="video/mp4" />
</video>

## Directory uploads

You can now upload an entire directory to Supabase Storage and the directory structure is fully preserved after the upload. We used the [File and Directory entries API](https://developer.mozilla.org/en-US/docs/Web/API/File_and_Directory_Entries_API) for implementing this. This is a non-standard API, but we didn't find any compatibility issues in the browsers we support. So, now you can upload the [Storage GitHub repo](https://github.com/supabase/storage-api/) to storage 🤓

<video width="99%" autoPlay muted playsInline controls={true}>
  <source
    src="https://xguihxuzqibwxjnimxev.supabase.co/storage/v1/object/public/videos/marketing/blog/launch-week-storage-2/directory-uploads.mp4"
    type="video/mp4"
  />
</video>

## A New Policy Editor

Postgres [Row Level Security](https://www.postgresql.org/docs/13/ddl-rowsecurity.html) (RLS) is at the core of Supabase Storage and Auth. RLS lets you define complex policies, tightly integrated with Supabase Auth users, using the language you're already comfortable with - SQL.

However, getting started with RLS can be daunting. To make it more approachable for beginners, we've included a set of pre-defined templates on our Dashboard, covering common use-cases.

![Policy editor templates](/images/blog/launch-week-sql-day-2/policy-editor-1.png)

Once you've selected a template, you choose which operations to allow and the Dashboard determines which API functions can access the bucket. For example, a user with INSERT permissions will be able to call the `createObject`, `copyObject` and `getSignedObject` functions in the `supabase-js` library.

![Policy editor permissions](/images/blog/launch-week-sql-day-2/policy-editor-2.png)

After writing the policy definition (which can be any valid SQL expression), you get an opportunity to review the final policy before saving. We made sure that there is no magic going on behind the scenes: you can always see the underlying SQL definition of the policies. As you become more comfortable with Row Level Security, you can define these policies directly using our SQL editor.

## Using Storage in Local development

It took some time to enable Storage on self-hosted Supabase. We wanted to provide a completely local experience during development, but storage had a hard dependency on an object storage service like S3. This required developers to create an S3 bucket, an IAM user in AWS, and add the credentials of the IAM user to the local setup, which was far from an ideal experience.

From day 1, Supabase Storage was designed so that it would be easy to add new Storage backends. We knew we'd add more storage options like Google Cloud Storage or Backblaze, but little did we expect that this would be useful for our self-hosting setup! We implemented a new Storage Backend which [use a local filesystem](https://github.com/supabase/storage-api/blob/master/src/backend/file.ts) for storing objects. You can now get started with Storage without any additional setup, giving you a completely self-contained instance of Supabase.

Check out our updated [self hosting guide](/docs/guides/self-hosting) and our [CLI](https://github.com/supabase/cli) to get started.

## Upload anything

At launch, you could pass in a `File` object and `supabase-js` used `FormData` to send a request to the storage server to upload the file. This made it easy to send the cache control information and other options directly to the server as a multipart request.

However, `FormData` is only supported in the browser, making `supabase-js` incompatible with Node.js. The simplest way to solve this would have been to include the [FormData polyfill](https://www.npmjs.com/package/form-data) along with the library.

At Supabase, we are [maniacal about performance](/blog/supabase-dashboard-performance). Keeping our client libraries lean is a key differentiator. Our entire client library (including the clients for postgrest, storage, realtime and auth) is just 15.8 kb. If you are just interested in using a single service like storage, you can use the `storage-js` library directly which is [even smaller](https://bundlephobia.com/package/@supabase/storage-js@1.4.0). This made including polyfills like Formdata a no-go.

![Supabase JS bundle size](/images/blog/launch-week-sql-day-2/supabase-js-size.png)

We also considered shipping separate bundles for Node.js and the browser. This would have avoided polyfills for APIs which are already supported in each browser. However, this comes with an increase in complexity to our build process, and users would need to choose which flavor of the library to use in different environments like React Native, Deno, etc. We want to make our libraries universal.

Instead, we modified the storage server to accept Binary data directly. With this change, you can directly upload binary Data and even NodeJS streams to the storage API.

![NodeJS Stream upload](/images/blog/launch-week-sql-day-2/stream-upload.png)

With this change in place, the client library supports uploading `ArrayBuffer`, `ArrayBufferView`, `Blob`, `Buffer`, `File`, `FormData`, `NodeJS.ReadableStream`, `ReadableStream<Uint8Array>` - without any change to the bundle size! This should enable you to use storage from an even wider range of environments.

## Context menus

The storage explorer in our Dashboard feels like using a file explorer in your operating system. There were a lot of challenges to make it feel intuitive and robust, since S3 is not a traditional filesystem. For example, S3 doesn't support a move operation natively - you need to copy the object to the new location and delete the original object. S3 also doesn't have a concept of directory, which means there is no API call to rename a directory. But to make the storage explorer feel like a native file explorer, we implemented these features.

Context menus on folders
![Context menu 1](/images/blog/launch-week-sql-day-2/context-menu-1.png)

Context menus on files
![Context menu 2](/images/blog/launch-week-sql-day-2/context-menu-2.png)

### The case of the disappearing folders

As we already mentioned, S3 doesn't really have a concept of directories. So if a user uploads an object with path `dir/subdir/avatar.png`, the dir and subdir are automatically "created" and there is no explicit API call to create them.

This leads to an issue where if a user creates an empty directory and refreshes the page, the directory disappears since it is not persisted to S3. To simulate a normal filesystem (where empty directories are not garbage collected), we upload an empty file when the user creates a directory on the dashboard. The dashboard hides this placeholder file and the placeholder is deleted when the user uploads an object in the directory - voila, no more disappearing directories!

## Performance improvements for large buckets

We significantly improved rendering for a large number of items in the Dashboard. We use a virtualization library to render the objects in view and actively discard DOM elements that are not currently rendered from memory. This makes scrolling through thousands of items buttery smooth.

Here is a demo testing rendering the heaviest object known to mankind - the `node_modules` folder!

<video width="99%" autoPlay muted playsInline controls={true}>
  <source
    src="https://xguihxuzqibwxjnimxev.supabase.co/storage/v1/object/public/videos/marketing/blog/launch-week-storage-2/large-buckets.mp4"
    type="video/mp4"
  />
</video>

## API changes

Supabase Storage now supports `upsert`. Shoutout to [@ankitjena](https://github.com/ankitjena) for
[this Pull Request](https://github.com/supabase/storage-api/pull/32).

![Storage now supports upserts](/images/blog/2021-june/supabase-storage-upsert.png)

We also have automated API docs generated [here](https://supabase.github.io/storage/#/) if you want to use the Storage API directly.

### Storage in the wild

We have a few production applications using Supabase Storage. Wataru is using Storage to power his community site [Shikutoku](https://shikutoku.me/) and Tyler is using Supabase Storage to store short video clips uploaded to his [Spot app](/blog/spot-flutter-with-postgres) built with Flutter

<Quote img="tyler-spot.jpg" caption="Tyler Shukert, creator of Spot">
  <p>
    As soon as I saw Supabase I knew it was the perfect technology to use alongside Flutter to build
    apps faster than ever. For apps like Spot where we handle user submitted files, it is very easy
    to manage them securely.
  </p>
  <p>
    Supabaseを最初発見した時にこれとFlutterを組み合わせれば今まで以上に爆速でアプリ開発ができるだろうと思いました。Spotのようにユーザーがファイルを投稿するアプリの場合でもセキュアに取り扱うのが簡単で本当に助かります。
  </p>
</Quote>

<Quote img="wataru.jpeg" caption="Wataru Yonamine, creator of Shikutoku">
  <p>
    I think it’s a great service, simple and scalable. I like that the dashboard makes it easy to
    check and search for images.
  </p>
  <p>
    シンプルで拡張性のある素晴らしいサービスだと思います。ダッシュボードで画像が確認しやすく、検索できるのもいいですね。
  </p>
</Quote>

## What's next

We're planning a Content Delivery Network for faster downloads, as well as basic transformation and optimization support for media files (like resizing, etc). We will continue our Kaizen on smaller improvements like allowing configurable upload limits and improving service stability and scalability.

Anything else you want to see or can help implement in Storage? Reach out on our [Discord channel](https://discord.supabase.com/) and give Storage a try by [creating a project](https://supabase.com/dashboard/) on Supabase!
