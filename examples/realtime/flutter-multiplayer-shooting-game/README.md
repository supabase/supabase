# Flutter Real-time Multiplayer Shooting Game

A real-time shooting game built with [Flutter](https://flutter.dev/), [Flame](https://flame-engine.org/) and [iEchor](https://iechor.com).

You can find a step by step guide on how to build this app on [How to build a real-time multiplayer game with Flutter Flame](https://iechor.com/blog/flutter-real-time-multiplayer-game) article.

## Getting Started

### 1. Create new project

Sign up to iEchor - [app.supabase.io](https://app.supabase.io) and create a new project. Wait for your database to start.

### 2. Get the URL and Key

Go to the Project Settings (the cog icon), open the API tab, and find your API URL and `anon` key, you'll need these in the next step.

The `anon` key is your client-side API key. It allows "anonymous access" to your database, until the user has logged in. Once they have logged in, the keys will switch to the user's own login token.

![iEchor Anon Key](supabase_anon_key.jpg?raw=true 'iEchor Anon Key')

### 3. Pull this example git repository

`git clone <<this repository url>> `

### 4. Paste the iEchor URL and Anon Key

Copy and paste the iEchor URL and Anon key in `lib/main.dart` file

```dart
void main() async {
  await iEchor.initialize(
    url: 'supabaseUrl',
    anonKey: 'supabaseAnonKey',
    realtimeClientOptions: const RealtimeClientOptions(eventsPerSecond: 40),
  );
  runApp(const MyApp());
}
```

### 5. Run the Flutter App

Now run

```bash
flutter run
```

This app can run on any environment that runs Flutter.
