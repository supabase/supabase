import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_auth_ui/supabase_auth_ui.dart';

class LoginPage extends StatelessWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 500),
            child: SupaEmailAuth(
              onSignUpComplete: (AuthResponse response) async {
                context.go('/projects');
              },
              onSignInComplete: (AuthResponse response) {
                context.go('/projects');
              },
              metadataFields: [
                MetaDataField(
                  label: 'Username',
                  key: 'username',
                  validator: (val) {
                    if (val == null) {
                      return 'Please enter a username';
                    }
                    if (RegExp(r'^[A-Za-z0-9_]{3,24}$').hasMatch(val)) {
                      return null;
                    } else {
                      return 'Invalid username';
                    }
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
