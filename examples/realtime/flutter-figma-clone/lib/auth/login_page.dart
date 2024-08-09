import 'package:canvas/project/projects_page.dart';
import 'package:flutter/material.dart';
import 'package:supabase_auth_ui/supabase_auth_ui.dart';

class LoginPage extends StatelessWidget {
  static route() => MaterialPageRoute(builder: (context) => const LoginPage());

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
                Navigator.of(context).pushReplacement(ProjectsPage.route());
              },
              onSignInComplete: (AuthResponse response) {
                Navigator.of(context).pushReplacement(ProjectsPage.route());
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
