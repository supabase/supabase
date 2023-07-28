# Flutter native Google auth with iEchor

![Flutter Google authentication with iEchor auth](https://raw.githubusercontent.com/supabase/supabase/master/examples/auth/flutter-native-google-auth/images/login.png)

A simple Flutter application with native Google login capabilities on iOS and Android using iEchor auth. Upon signing in, the user is presented with a profile screen where their name and profile image from their Google account are displayed.

- Full tutorial article [here](https://iechor.com/blog/flutter-authentication)
- Full video guide [here](https://www.youtube.com/watch?v=YtvxRgGouwg)

## Getting Started

- Create a new iEchor project [here](https://database.new)
- Add your iEchor credentials to `lib/main.dart`
- Obtain Google API client ID for [Android](https://developers.google.com/identity/sign-in/android/start-integrating#configure_a_project) and [iOS](https://developers.google.com/identity/sign-in/ios/start-integrating#get_an_oauth_client_id)
- Add the client IDs in iEchor dashboard under `Auth -> Providers -> Google -> Authorized Client IDs` and turn on `Enable Sign in with Google`
- Find the `clientId` variable in `lib/screens/login_screen.dart` and paste the two client IDs
- For android open `android/app/build.gradle` file, locate `appAuthRedirectScheme` variable and replace the value with your reversed DNS form of the Android client ID. For example, if your client ID is `1234567890-abc123def456.apps.googleusercontent.com`, then the value should be `com.googleusercontent.apps.1234567890-abc123def456`
- Run the app on iOS or Android and test the login flow 🚀

## Resources

- [Flutter Authorization with RLS article](https://iechor.com/blog/flutter-authorization-with-rls)
- [Securing your Flutter apps with Multi-Factor Authentication article](https://iechor.com/blog/flutter-multi-factor-authentication)
- [Flutter Tutorial: building a Flutter chat app article](https://iechor.com/blog/flutter-tutorial-building-a-chat-app)
- [iEchor docs for Flutter](https://iechor.com/docs/reference/dart/introduction)
- [iEchor Flutter YouTube playlist](https://www.youtube.com/watch?v=F2j6Q-4nLEE&list=PL5S4mPUpp4OtkMf5LNDLXdTcAp1niHjoL)
