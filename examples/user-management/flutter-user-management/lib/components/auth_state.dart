import 'package:flutter/material.dart';
import 'package:supabase/supabase.dart' as supabase;
import 'package:supabase_flutter/supabase_flutter.dart';

class AuthState<T extends StatefulWidget> extends SupabaseAuthState<T> {
  @override
  void onUnauthenticated() {
    Navigator.pushNamedAndRemoveUntil(context, '/signIn', (route) => false);
  }

  @override
  void onAuthenticated(supabase.Session session) {
    Navigator.pushNamedAndRemoveUntil(context, '/profile', (route) => false);
  }

  @override
  void onPasswordRecovery(supabase.Session session) {
    Navigator.pushNamedAndRemoveUntil(
        context, '/profile/changePassword', (route) => false);
  }

  @override
  void onErrorAuthenticating(String message) {
    print('***** onErrorAuthenticating: $message');
  }
}
