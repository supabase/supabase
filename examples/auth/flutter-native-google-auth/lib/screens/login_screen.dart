import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:flutter/material.dart';
import 'package:flutter_appauth/flutter_appauth.dart';
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

  /// Function to generate a random 16 character string.
  String _generateRandomString() {
    final random = Random.secure();
    return base64Url.encode(List<int>.generate(16, (_) => random.nextInt(256)));
  }

  Future<AuthResponse> _googleSignIn() async {
    /// TODO: update the iOS and Web client ID with your own.
    ///
    /// Client ID that you registered with Google Cloud.
    /// Note that in order to perform Google sign in on Android, you need to
    /// provide the web client ID, not the Android client ID.
    final clientId = Platform.isIOS ? 'IOS_CLIENT_ID' : 'WEB_CLIENT_ID';

    late final String? idToken;
    late final String? accessToken;
    String? rawNonce;

    // Use AppAuth to perform Google sign in on iOS
    // and use GoogleSignIn package for Google sign in on Android
    if (Platform.isIOS) {
      const appAuth = FlutterAppAuth();

      // Just a random string
      rawNonce = _generateRandomString();
      final hashedNonce = sha256.convert(utf8.encode(rawNonce)).toString();

      /// Set as reversed DNS form of Google Client ID + `:/` for Google login
      final redirectUrl = '${clientId.split('.').reversed.join('.')}:/';

      /// Fixed value for google login
      const discoveryUrl =
          'https://accounts.google.com/.well-known/openid-configuration';

      // authorize the user by opening the concent page
      final result = await appAuth.authorize(
        AuthorizationRequest(
          clientId,
          redirectUrl,
          discoveryUrl: discoveryUrl,
          nonce: hashedNonce,
          scopes: [
            'openid',
            'email',
            'profile',
          ],
        ),
      );

      if (result == null) {
        throw 'No result';
      }

      // Request the access and id token to google
      final tokenResult = await appAuth.token(
        TokenRequest(
          clientId,
          redirectUrl,
          authorizationCode: result.authorizationCode,
          discoveryUrl: discoveryUrl,
          codeVerifier: result.codeVerifier,
          nonce: result.nonce,
          scopes: [
            'openid',
            'email',
          ],
        ),
      );

      accessToken = tokenResult?.accessToken;
      idToken = tokenResult?.idToken;
    } else {
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
    }

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
      nonce: rawNonce,
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
