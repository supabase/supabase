---
id: upgrade-guide
title: Upgrade to supabase-flutter v1
description: 'Learn how to upgrade to supabase-flutter v1.'
---

supabase-flutter focuses on improving the developer experience and making it easier to use. This guide demonstrates how to upgrade from supabase-flutter v0 to v1.

## Upgrade the client library

<RefSubLayout.EducationRow>
  <RefSubLayout.Details>

Update the package in your pubspec.yaml file.

  </RefSubLayout.Details>
  <RefSubLayout.Examples>

```yaml
supabase_flutter: ^1.0.0
```

  </RefSubLayout.Examples>
</RefSubLayout.EducationRow>

## Error handling

<RefSubLayout.EducationRow>
  <RefSubLayout.Details>

The way supabase-flutter throws error has changed in v1. In v0, errors were returned as a response. In v1, errors are thrown as exceptions. This makes it more intuitive as a Flutter developer to handle errors.

  </RefSubLayout.Details>
  <RefSubLayout.Examples>

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="0.x"
  queryGroup="version"
>
<TabPanel id="0.x" label="Before">

```dart
final res = await supabase.from('my_table').select().execute();
final error = res.error;
if (error != null) {
  // handle error
}
final data = res.data;
```

</TabPanel>
<TabPanel id="1.0x" label="After">

```dart
try {
    final data = supabase.from('my_table').select();
} catch (error) {
    // handle error
}
```

</TabPanel>
</Tabs>

  </RefSubLayout.Examples>
</RefSubLayout.EducationRow>

## Auth classes and methods

### Usage of `SupabaseAuthState` and `SupabaseAuthRequiredState` classes

<RefSubLayout.EducationRow>
  <RefSubLayout.Details>

In v0, `SupabaseAuthState` and `SupabaseAuthRequiredState` were required to handle automatic token refresh and to listen to auth state change. In v1, `SupabaseAuthState` and `SupabaseAuthRequiredState` are deprecated, and token refresh will happen automatically just by initializing Supabase. [`onAuthStateChange`](#listening-to-auth-state-change) can be used to action on auth state change.

  </RefSubLayout.Details>
  <RefSubLayout.Examples>

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="0.x"
  queryGroup="version"
>
<TabPanel id="0.x" label="Before">

```dart
await Supabase.initialize(
  url: 'SUPABASE_URL',
  anonKey: 'SUPABASE_ANON_KEY',
);
...

class AuthState<T extends StatefulWidget> extends SupabaseAuthState<T> {
  ...
}

...

class AuthRequiredState<T extends StatefulWidget> extends SupabaseAuthState<T> {
  ...
}
```

</TabPanel>
<TabPanel id="1.0x" label="After">

```dart
await Supabase.initialize(
  url: 'SUPABASE_URL',
  anonKey: 'SUPABASE_ANON_KEY',
);
```

</TabPanel>
</Tabs>

  </RefSubLayout.Examples>
</RefSubLayout.EducationRow>

### Listening to auth state change

<RefSubLayout.EducationRow>
  <RefSubLayout.Details>

`onAuthStateChange` now returns a `Stream`.

  </RefSubLayout.Details>
  <RefSubLayout.Examples>

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="0.x"
  queryGroup="version"
>
<TabPanel id="0.x" label="Before">

```dart
final authSubscription = supabase.auth.onAuthStateChange((event, session) {
  // handle auth state change
});

// Unsubscribe when no longer needed
authSubscription.data?.unsubscribe();
```

</TabPanel>
<TabPanel id="1.0x" label="After">

```dart
final authSubscription = supabase.auth.onAuthStateChange.listen((data) {
      final AuthChangeEvent event = data.event;
      final Session? session = data.session;
      // handle auth state change
    });

// Unsubscribe when no longer needed
authSubscription.cancel();
```

</TabPanel>
</Tabs>

  </RefSubLayout.Examples>
</RefSubLayout.EducationRow>

### Sign in with email and password

<RefSubLayout.EducationRow>
  <RefSubLayout.Details>

`signIn()` has been deprecated in favor of more explicit method signatures to help with type hinting. Previously it was difficult for developers to know what they were missing (e.g., a lot of developers didn't realize they could use passwordless magic links).

  </RefSubLayout.Details>
  <RefSubLayout.Examples>

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="0.x"
  queryGroup="version"
>
<TabPanel id="0.x" label="Before">

```dart
await supabase.auth.signIn(email: email, password: password);
```

</TabPanel>
<TabPanel id="1.0x" label="After">

```dart
await supabase.auth.signInWithPassword(email: email, password: password);
```

</TabPanel>
</Tabs>

  </RefSubLayout.Examples>
</RefSubLayout.EducationRow>

<RefSubLayout.EducationRow>
  <RefSubLayout.Details>

### Sign in with magic link

  </RefSubLayout.Details>
  <RefSubLayout.Examples>

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="0.x"
  queryGroup="version"
>
<TabPanel id="0.x" label="Before">

```dart
await supabase.auth.signIn(email: email);
```

</TabPanel>
<TabPanel id="1.0x" label="After">

```dart
await supabase.auth.signInWithOtp(email: email);
```

</TabPanel>
</Tabs>

  </RefSubLayout.Examples>
</RefSubLayout.EducationRow>

<RefSubLayout.EducationRow>
  <RefSubLayout.Details>

### Sign in with a third-party OAuth provider

  </RefSubLayout.Details>
  <RefSubLayout.Examples>

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="0.x"
  queryGroup="version"
>
<TabPanel id="0.x" label="Before">

```dart
await supabase.auth.signInWithProvider(
  Provider.github,
  options: AuthOptions(
      redirectTo: kIsWeb
          ? null
          : 'io.supabase.flutter://reset-callback/'),
);
```

</TabPanel>
<TabPanel id="1.0x" label="After">

```dart
await supabase.auth.signInWithOAuth(
  Provider.github,
  redirectTo: kIsWeb ? null : 'io.supabase.flutter://reset-callback/',
);
```

</TabPanel>
</Tabs>

  </RefSubLayout.Examples>
</RefSubLayout.EducationRow>

<RefSubLayout.EducationRow>
  <RefSubLayout.Details>

### Sign in with phone

  </RefSubLayout.Details>
  <RefSubLayout.Examples>

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="0.x"
  queryGroup="version"
>
<TabPanel id="0.x" label="Before">

```dart
await supabase.auth.signIn(
  phone: '+13334445555',
  password: 'example-password',
);
```

</TabPanel>
<TabPanel id="1.0x" label="After">

```dart
await supabase.auth.signInWithPassword(
  phone: '+13334445555',
  password: 'example-password',
);
```

</TabPanel>
</Tabs>

  </RefSubLayout.Examples>
</RefSubLayout.EducationRow>

<RefSubLayout.EducationRow>
  <RefSubLayout.Details>

### Sign in with phone using OTP

  </RefSubLayout.Details>
  <RefSubLayout.Examples>

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="0.x"
  queryGroup="version"
>
<TabPanel id="0.x" label="Before">

```dart
final res = await supabase.auth.signIn(phone: phone);
```

</TabPanel>
<TabPanel id="1.0x" label="After">

```dart
await supabase.auth.signInWithOtp(
  phone: phone,
);

// After receiving an SMS with an OTP.
await supabase.auth.verifyOTP(
  type: OtpType.sms,
  token: token,
  phone: phone,
);
```

</TabPanel>
</Tabs>

  </RefSubLayout.Examples>
</RefSubLayout.EducationRow>

<RefSubLayout.EducationRow>
  <RefSubLayout.Details>

### Reset password for email

  </RefSubLayout.Details>
  <RefSubLayout.Examples>

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="0.x"
  queryGroup="version"
>
<TabPanel id="0.x" label="Before">

```dart
await supabase.auth.api.resetPasswordForEmail(
  email,
  options:
      AuthOptions(redirectTo: 'io.supabase.flutter://reset-callback/'),
);
```

</TabPanel>
<TabPanel id="1.0x" label="After">

```dart
await supabase.auth.resetPasswordForEmail(
  email,
  redirectTo: kIsWeb ? null : 'io.supabase.flutter://reset-callback/',
);
```

</TabPanel>
</Tabs>

  </RefSubLayout.Examples>
</RefSubLayout.EducationRow>

<RefSubLayout.EducationRow>
  <RefSubLayout.Details>

### Get the user's current session

  </RefSubLayout.Details>
  <RefSubLayout.Examples>

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="0.x"
  queryGroup="version"
>
<TabPanel id="0.x" label="Before">

```dart
final session = supabase.auth.session();
```

</TabPanel>
<TabPanel id="1.0x" label="After">

```dart
final Session? session = supabase.auth.currentSession;
```

</TabPanel>
</Tabs>

  </RefSubLayout.Examples>
</RefSubLayout.EducationRow>

<RefSubLayout.EducationRow>
  <RefSubLayout.Details>

### Get the logged-in user

  </RefSubLayout.Details>
  <RefSubLayout.Examples>

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="0.x"
  queryGroup="version"
>
<TabPanel id="0.x" label="Before">

```dart
final user = supabase.auth.user();
```

</TabPanel>
<TabPanel id="1.0x" label="After">

```dart
final User? user = supabase.auth.currentUser;
```

</TabPanel>
</Tabs>

  </RefSubLayout.Examples>
</RefSubLayout.EducationRow>

<RefSubLayout.EducationRow>
  <RefSubLayout.Details>

### Update user data for a logged-in user

  </RefSubLayout.Details>
  <RefSubLayout.Examples>

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="0.x"
  queryGroup="version"
>
<TabPanel id="0.x" label="Before">

```dart
await supabase.auth.update(
  UserAttributes(data: {'hello': 'world'})
);
```

</TabPanel>
<TabPanel id="1.0x" label="After">

```dart
await supabase.updateUser(
  UserAttributes(
    data: { 'hello': 'world' },
  ),
);
```

</TabPanel>
</Tabs>

  </RefSubLayout.Examples>
</RefSubLayout.EducationRow>

## Data methods

`.insert()` / `.upsert()` / `.update()` / `.delete()` no longer return rows by default. Previously, these methods return inserted/updated/deleted rows by default (which caused [some confusion](https://github.com/supabase/supabase/discussions/1548)), and you can opt to not return it by specifying `returning: 'minimal'`. Now the default behavior is to not return rows. To return inserted/updated/deleted rows, add a `.select()` call at the end.

Also, calling `.execute()` at the end of the query was a requirement in v0, but deprecated in v1.

<RefSubLayout.EducationRow>
  <RefSubLayout.Details>

### Insert without returning inserted data

  </RefSubLayout.Details>
  <RefSubLayout.Examples>

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="0.x"
  queryGroup="version"
>
<TabPanel id="0.x" label="Before">

```dart
await supabase
  .from('my_table')
  .insert(data, returning: ReturningOption.minimal)
  .execute();

```

</TabPanel>
<TabPanel id="1.0x" label="After">

```dart
await supabase.from('my_table').insert(data);
```

</TabPanel>
</Tabs>

  </RefSubLayout.Examples>
</RefSubLayout.EducationRow>

<RefSubLayout.EducationRow>
  <RefSubLayout.Details>

### Insert with returning inserted data

  </RefSubLayout.Details>
  <RefSubLayout.Examples>

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="0.x"
  queryGroup="version"
>
<TabPanel id="0.x" label="Before">

```dart
final res = await supabase
  .from('my_table')
  .insert(data)
  .execute();
```

</TabPanel>
<TabPanel id="1.0x" label="After">

```dart
final insertedData = await supabase.from('my_table').insert(data).select();
```

</TabPanel>
</Tabs>

  </RefSubLayout.Examples>
</RefSubLayout.EducationRow>

## Realtime methods

<RefSubLayout.EducationRow>
  <RefSubLayout.Details>

### Stream

`.stream()` no longer needs the `.execute()` at the end. Also, filtering by `eq` is a lot easier now. `primaryKey` is now a named parameter to make it more obvious what to pass.

  </RefSubLayout.Details>
  <RefSubLayout.Examples>

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="0.x"
  queryGroup="version"
>
<TabPanel id="0.x" label="Before">

```dart
supabase.from('my_table:id=eq.120')
  .stream(['id'])
  .listen();
```

</TabPanel>
<TabPanel id="1.0x" label="After">

```dart
supabase.from('my_table')
  .stream(primaryKey: ['id'])
  .eq('id', '120')
  .listen();
```

</TabPanel>
</Tabs>

  </RefSubLayout.Examples>
</RefSubLayout.EducationRow>

<RefSubLayout.EducationRow>
  <RefSubLayout.Details>

### Subscribe

  </RefSubLayout.Details>
  <RefSubLayout.Examples>

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="0.x"
  queryGroup="version"
>
<TabPanel id="0.x" label="Before">

```dart
final subscription = supabase
  .from('countries')
  .on(SupabaseEventTypes.all, (payload) {
    // Handle realtime payload
  })
  .subscribe();
```

</TabPanel>
<TabPanel id="1.0x" label="After">

```dart
final channel = supabase.channel('*');
channel.on(
  RealtimeListenTypes.postgresChanges,
  ChannelFilter(event: '*', schema: '*'),
  (payload, [ref]) {
    // Handle realtime payload
  },
).subscribe();
```

</TabPanel>
</Tabs>

  </RefSubLayout.Examples>
</RefSubLayout.EducationRow>

<RefSubLayout.EducationRow>
  <RefSubLayout.Details>

### Unsubscribe

  </RefSubLayout.Details>
  <RefSubLayout.Examples>

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="0.x"
  queryGroup="version"
>
<TabPanel id="0.x" label="Before">

```dart
supabase.removeSubscription(subscription);
```

</TabPanel>
<TabPanel id="1.0x" label="After">

```dart
await supabase.removeChannel(channel);
```

</TabPanel>
</Tabs>

  </RefSubLayout.Examples>
</RefSubLayout.EducationRow>
