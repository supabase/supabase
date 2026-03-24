---
title: 'supabase-flutter v1 Released'
description: We've released supabase-flutter v1. More intuitive way of accessing Supabase from your Flutter application.
author: tyler_shukert
imgSocial: flutter-v1-release/flutter_v1_official_release.jpeg
imgThumb: flutter-v1-release/flutter_v1_official_release.jpeg
categories:
  - engineering
tags:
  - flutter
  - mobile
date: '2022-10-21'
toc_depth: 3
---

A few months ago, we announced a [developer preview version of supabase-flutter SDK](https://supabase.com/blog/supabase-flutter-sdk-1-developer-preview). Since then, we have heard a lot of amazing feedback from the community, and have been improving it. Today, we are happy to announce the stable v1 of [supabase-flutter](https://pub.dev/packages/supabase_flutter). You can also find the updated [quick start guide](https://supabase.com/docs/guides/with-flutter), [documentation](https://supabase.com/docs/reference/dart) and a [migration guide from v0](https://supabase.com/docs/reference/dart/v0/upgrade-guide).

## What is new in v1?

supabase-flutter v1 focuses on improved developer experience. The new version requires far less boiler plate code as well as it provides more intuitive APIs. Here are some highlights of the update.

### No more `.execute()`

Previously, for `.select()`, `.insert()`, `.update()`, `.delete()` and `.stream()` required `execute()` to be called at the end. On top of that, errors are thrown, not returned, so you can be sure that you have the query results in the returned value.

```dart
// Before
final response = await supabase.from('messages').select().execute();
final data = response.data;

// After
final data = await supabase.from('messages').select();
```

### More predictable auth methods

Names of the auth methods are more descriptive about what they do. Here are some examples of the new methods:

```dart
await supabase.auth.signInWithPassword(email: email, password: password);

await supabase.auth.signInWithOAuth(Provider.github)
```

Also, `onAuthStateChange` returns stream, which feels more natural for anyone coding in Dart.

```dart
supabase.auth.onAuthStateChange.listen((data) {
  final AuthChangeEvent event = data.event;
  final Session? session = data.session;
});
```

### Realtime Multiplayer edition support

During the last launch week, we announced the [general availability of Realtime Multiplayer](https://supabase.com/blog/supabase-realtime-multiplayer-general-availability). supabase-flutter now has first class support for the two newly introduced realtime methods, broadcast and presence. Broadcast can be used to share realtime data to all connected clients with low latency. Presence is a way to let other connected clients know the status of the client. You can visit [multiplayer.dev](http://multiplayer.dev) to see a quick demo of the feature.

```dart
final channel = Supabase.instance.client.channel('my_channel');

// listen to `location` broadcast events
channel.on(
    RealtimeListenTypes.broadcast,
    ChannelFilter(
      event: 'location',
    ), (payload, [ref]) {
	// Do something exciting with the broadcast event
});

// send `location` broadcast events
channel.send(
  type: RealtimeListenTypes.broadcast,
  event: 'location',
  payload: {'lat': 1.3521, 'lng': 103.8198},
);

// listen to presence states
channel.on(RealtimeListenTypes.presence, ChannelFilter(event: 'sync'),
    (payload, [ref]) {
	// Do something exciting with the presence state
});

// subscribe to the above changes
channel.subscribe((status) async {
  if (status == 'SUBSCRIBED') {
    // if subscribed successfully, send presence event
    final status = await channel.track({'user_id': myUserId});
  }
});
```

These are just tip of the iceberg of all the updates that we shipped in v1. Check out the [documentation](https://supabase.com/docs/reference/dart/) to see the full list.

## Acknowledgements

It required massive support from the community to bring the supabase-flutter to where it is today. I would like to thank everyone who has contributed to the library, and a special thanks to [Bruno](https://github.com/bdlukaa) and [Vinzent](https://github.com/Vinzent03), who have been key for this release. We really could not have done it without you!

## Resources

- [Install supabase-flutter v1.0](https://pub.dev/packages/supabase_flutter)
- [supabase-flutter documentation](https://supabase.com/docs/reference/dart/)
- [v0 to v1 migration guide](https://supabase.com/docs/reference/dart/v0/upgrade-guide)
- [Flutter Tutorial: building a Flutter chat app](https://supabase.com/blog/flutter-tutorial-building-a-chat-app)
- [Flutter Tutorial - Part 2: Authentication and Authorization with RLS](https://supabase.com/blog/flutter-authentication-and-authorization-with-rls)
- [How to build a real-time multiplayer game with Flutter Flame](https://supabase.com/blog/flutter-real-time-multiplayer-game)
- [Build a Flutter app with Very Good CLI and Supabase](https://verygood.ventures/blog/flutter-app-very-good-cli-supabase)
