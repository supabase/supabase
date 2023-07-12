# Flutter native Google auth with Supabase

![Flutter Google authentication with Supabase auth](https://raw.githubusercontent.com/supabase/supabase/main/examples/auth/flutter-native-google-auth/images/login.png)

A simple Flutter application with native Google login capabilities on iOS and Android using Supabase auth. Upon signing in, the user is presented with a profile screen where their name and profile image from their Google account are displayed.

- Full tutorial article [here](https://supabase.com/blog/flutter-authentication)
- Full video guide [here](https://www.youtube.com/watch?v=YtvxRgGouwg)

## Getting Started

- Create a new Supabase project [here](https://database.new)
- Add your Supabase credentials to `lib/main.dart`
- Obtain Google API client ID for [Android](https://developers.google.com/identity/sign-in/android/start-integrating#configure_a_project) and [iOS](https://developers.google.com/identity/sign-in/ios/start-integrating#get_an_oauth_client_id)
- Add the client IDs in Supabase dashboard under `Auth -> Providers -> Google -> Authorized Client IDs` and turn on `Enable Sign in with Google`
- Find the `clientId` variable in `lib/screens/login_screen.dart` and paste the two client IDs
- For android open `android/app/build.gradle` file, locate `appAuthRedirectScheme` variable and replace the value with your reversed DNS form of the Android client ID. For example, if your client ID is `1234567890-abc123def456.apps.googleusercontent.com`, then the value should be `com.googleusercontent.apps.1234567890-abc123def456`
- Run the app on iOS or Android and test the login flow 🚀

## Resources

- [Flutter Authorization with RLS article](https://supabase.com/blog/flutter-authorization-with-rls)
- [Securing your Flutter apps with Multi-Factor Authentication article](https://supabase.com/blog/flutter-multi-factor-authentication)
- [Flutter Tutorial: building a Flutter chat app article](https://supabase.com/blog/flutter-tutorial-building-a-chat-app)
- [Supabase docs for Flutter](https://supabase.com/docs/reference/dart/introduction)
- [Supabase Flutter YouTube playlist](https://www.youtube.com/watch?v=F2j6Q-4nLEE&list=PL5S4mPUpp4OtkMf5LNDLXdTcAp1niHjoL)
