---
title: 'Supabase Flutter SDK 1.0 Developer Preview'
description: Supabase Flutter SDK is getting a major update and we need your help making it better.
author: tyler_shukert
imgSocial: flutter-1/supabase-flutter-1.jpg
imgThumb: flutter-1/supabase-flutter-1.jpg
categories:
  - engineering
tags:
  - flutter
  - mobile
date: '2022-08-02'
toc_depth: 3
---

Today, we are releasing of Developer Preview version of v1.0 of [Supabase Flutter SDK](https://pub.dev/packages/supabase_flutter/versions/1.0.0-dev.1). Flutter has quickly become one of the most popular frameworks for developers to build cross-platform mobile apps. We can attest to that growth, our Flutter SDK is one of the most popular libraries and each day we see more Flutter devs choosing Supabase.

For this release, our main focus is developer experiences. We would love for you to try the SDK and provide your feedback so that we can continue to improve!

Before we dive into the actual updates, I would like to thank all the community contributors who have helped the library to be where it is today.

## Better developer experience

Until now, there were some disputable implementations in the Flutter SDK. We've made several improvements:

### Automatically handling auth state persistence

Previously, `supabase-flutter` required a class that extends `SupabaseAuthState` or `SupabaseAuthRequiredState` to persist auth state. With `supabase-flutter` 1.0, you no longer need to include these classes.

All you need to persist the auth state is initialize Supabase and everything else will be automatically taken care of. `SupabaseAuthState` and `SupabaseAuthRequiredState` have been removed from the code base.

```dart
// Before
await Supabase.initialize(
  url: 'SUPABASE_URL',
  anonKey: 'SUPABASE_ANON_KEY',
);
...

class AuthState<T extends StatefulWidget> extends SupabaseAuthState<T> {
  ...
}

// After
await Supabase.initialize(
  url: 'SUPABASE_URL',
  anonKey: 'SUPABASE_ANON_KEY',
);
```

### Automatically handling deep links

Deep link handling had similar issues previously, requiring you to implement `SupabaseAuthState` or `SupabaseAuthRequiredState` classes.

With the 1.0 update, you no longer need to use these classes, and deep links will be automatically handled. You can listen to `onAuthStateChange` to handle when a deep link is received to redirect users to a new screen.

```dart
// Before
void onReceivedAuthDeeplink(Uri uri) {
  Supabase.instance.log('onReceivedAuthDeeplink uri: $uri');
}

// After
await Supabase.instance.initialize(
  url: 'SUPABASE_URL',
  anonKey: 'SUPABASE_ANON_KEY',
);
```

### Throwing errors instead of returning them

When `supabase-dart` and `supabase-flutter` were created, we wanted to mirror the JavaScript library as much as possible. We soon realized that some syntax does not fit well when written in Dart. Throwing vs returning error is a good example of that. Since Dart does not have object destruction, the code becomes a bit tedious when errors are returned.

With `supabase-flutter` 1.0, we are throwing errors instead of returning them. This is consistent across all features from `auth`, `postgrest`, and `storage`.

```dart
// Before
final response = await Supabase.instance.from('messages').select().execute();
final data = response.data;
final error = response.error;

// After
try {
  final data = await Supabase.instance.from('messages').select();
} catch(error) {
  // Handle error here
}
```

### No more `.execute()` to get the data

We want this SDK to be as close as possible to the JavaScript SDK to provide consistent developer experience no matter what programming language you are using. Prior to the 1.0 update, whenever you called the `postgrest` endpoints, you had to call `.execute()` at the end of each query.

`.execute()` is now deprecated. You no longer needed it to query data from your Supabase database. This update, along with many many other improvements across the whole library, has been done by [Bruno D'Luka](https://github.com/bdlukaa), and I would love to give him a special shout out here!

```dart
// Before
final response = await Supabase.instance.from('messages').select().execute();
final data = response.data;

// After
final data = await Supabase.instance.from('messages').select();
```

## Desktop support for deeplinks

Ever since `supabase-flutter` was born, it supported only iOS, Android and Web for deep linking. This was a limitation of the deep link library that we were using.

With the 1.0 launch, we are moving to use [app_links](https://pub.dev/packages/app_links), which will enable us to support MacOS and Windows applications as well! Linux support is being worked on - follow the repo to keep updated.

![Supabase Flutter desktop support](/images/blog/flutter-1/supported-platforms-table.png)

## Multiplayer support

[Multiplayer](https://supabase.com/blog/supabase-realtime-with-multiplayer-features) is the next generation Supabase Realtime engine that was announced at the previous launch week.

We want our Flutter developers to experience this new multiplayer feature as well, so are working hard at bringing it to our Flutter SDK. It is not yet included in the developer preview of Supabase Flutter 1.0, but will be part of it when stable launch has been released.

## Supabase Auth UI for Flutter

![Supabase Auth UI for Flutter](/images/blog/flutter-1/supabase-flutter-auth-ui.png)

Last but not least, we are bringing you another library, the Supabase Auth UI for Supabase! When released, this library will enable you to implement a basic authentication screen without building it yourself. You can just load the library and display a nice looking Auth UI. The library takes your theme settings automatically to match the look and feel of your application.

You can get started with it on [pub.dev](https://pub.dev/packages/supabase_auth_ui).

I would like to thank [Fatuma](https://twitter.com/XquisiteDreamer) for single-handedly working on bringing us an easier authentication experience.

```dart
// Email and password signin form
SupaEmailAuth(
  authAction: AuthAction.signIn,
  redirectUrl: '/home',
),

// Magic Link signin form
SupaMagicAuth(),

// Social Login Buttons
SupaSocialsAuth(
  socialProviders: [
  SocialProviders.apple,
  SocialProviders.google,
  ],
  colored: true,
),
```

## Final thoughts

These updates are just the tip of the iceberg for 1.0. There are been many bug fixes and features constantly being added to the Supabase Flutter SDK. This could not have been possible without the help from the open source community. Here, I would also like to give a shout out to two other developers who have been a major part of the journey of this SDK: [Vinzent](https://twitter.com/Vinzent03_) and [Daniel Mossaband](https://github.com/DanMossa). They have been a huge part of the Supabase Flutter SDK - not just for the 1.0 release, but throughout the lifetime of the library.
For those of you who want to try out the new SDK, you can get the developer preview version from [supabase-flutter](https://pub.dev/packages/supabase_flutter/versions/1.0.0-dev.1) pub.dev page or can simply copy and paste the following into your pubspec.yaml file.

```yaml
supabase_flutter: ^1.0.0-dev.1
```

If you have any feedbacks, please let us know in the issues of the [supabase-flutter](https://github.com/supabase-community/supabase-flutter/issues) repository.

## Flutter Resources

- [supabase-flutter 1.0 developer preview](https://pub.dev/packages/supabase_flutter)
- [Flutter Tutorial: building a Flutter chat app](https://supabase.com/blog/flutter-tutorial-building-a-chat-app)
- [Flutter Tutorial - Part 2: Authentication and Authorization with RLS](https://supabase.com/blog/flutter-authentication-and-authorization-with-rls)
- [How to build a real-time multiplayer game with Flutter Flame](https://supabase.com/blog/flutter-real-time-multiplayer-game)
- [Build a Flutter app with Very Good CLI and Supabase](https://verygood.ventures/blog/flutter-app-very-good-cli-supabase)
