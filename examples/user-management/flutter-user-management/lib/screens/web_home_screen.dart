import 'dart:async';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '/components/auth_state.dart';

class WebHomeScreen extends StatefulWidget {
  @override
  _WebHomeScreenState createState() => _WebHomeScreenState();
}

class _WebHomeScreenState extends AuthState<WebHomeScreen>
    with SingleTickerProviderStateMixin {
  @override
  void initState() {
    super.initState();

    final uriParameters = SupabaseAuth.instance.parseUriParameters(Uri.base);
    if (uriParameters.containsKey('access_token') &&
        uriParameters.containsKey('refresh_token') &&
        uriParameters.containsKey('expires_in')) {
      /// Uri.base is a auth redirect link
      /// Call recoverSessionFromUrl to continue
      recoverSessionFromUrl(Uri.base);
    }
  }

  Future onSignIn() async {
    final hasAccessToken = await SupabaseAuth.instance.hasAccessToken;
    final String route = hasAccessToken ? '/profile' : '/signIn';

    stopAuthObserver();
    Navigator.pushNamed(context, route).then((_) => startAuthObserver());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Flutter user management'),
      ),
      body: Center(
        child: SizedBox(
          height: 50.0,
          child: ElevatedButton(
            onPressed: onSignIn,
            child: const Text('Sign in'),
          ),
        ),
      ),
    );
  }
}
