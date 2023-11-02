import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:myauthapp/main.dart';
import 'package:myauthapp/screens/profile_screen.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  @override
  void initState() {
    _setupAuthListener();
    super.initState();
  }

  void _setupAuthListener() {
    supabase.auth.onAuthStateChange.listen((data) {
      final event = data.event;
      if (event == AuthChangeEvent.signedIn) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => const ProfileScreen(),
          ),
        );
      }
    });
  }

  Future<AuthResponse> _googleSignIn() async {
    /// TODO: update the Web client ID with your own.
    ///
    /// Client ID that you registered with Google Cloud.
    /// Note that in order to perform Google sign in on Android, you need to
    /// provide the web client ID, not the Android client ID.
    const clientId = 'WEB_CLIENT_ID';

    late final String? idToken;
    late final String? accessToken;

    // Use AppAuth to perform Google sign in on iOS
    // and use GoogleSignIn package for Google sign in on Android

    final GoogleSignIn googleSignIn = GoogleSignIn(
      serverClientId: clientId,
      scopes: [
        'openid',
        'email',
      ],
    );
    final googleUser = await googleSignIn.signIn();
    final googleAuth = await googleUser!.authentication;
    accessToken = googleAuth.accessToken;
    idToken = googleAuth.idToken;

    if (idToken == null) {
      throw 'No ID Token';
    }
    if (accessToken == null) {
      throw 'No Access Token';
    }

    return supabase.auth.signInWithIdToken(
      provider: Provider.google,
      idToken: idToken,
      accessToken: accessToken,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Login'),
      ),
      body: Center(
        child: ElevatedButton(
          onPressed: _googleSignIn,
          child: const Text('Google login'),
        ),
      ),
    );
  }
}
