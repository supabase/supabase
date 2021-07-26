import 'dart:async';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import '/components/auth_state.dart';

class SplashScreen extends StatefulWidget {
  @override
  SplashScreenState createState() => SplashScreenState();
}

class SplashScreenState extends AuthState<SplashScreen>
    with SingleTickerProviderStateMixin {
  Timer? recoverSessionTimer;

  @override
  void initState() {
    super.initState();

    /// a timer to slow down session restore
    /// If not user can't really see the splash screen
    const _duration = Duration(seconds: 1);
    recoverSessionTimer = Timer(_duration, () {
      recoverSupabaseSession();
    });
  }

  /// on received auth deeplink, we should cancel recoverSessionTimer
  /// and wait for auth deep link handling result
  @override
  void onReceivedAuthDeeplink(Uri uri) {
    if (recoverSessionTimer != null) {
      recoverSessionTimer!.cancel();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SizedBox(
          height: 50.0,
          child: Image.asset(
            "assets/images/logo-dark.png",
          ),
        ),
      ),
    );
  }
}
