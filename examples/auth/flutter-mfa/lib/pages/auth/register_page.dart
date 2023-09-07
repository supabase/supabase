import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mfa_app/main.dart';
import 'package:mfa_app/pages/auth/login_page.dart';
import 'package:mfa_app/pages/mfa/enroll_page.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class RegisterPage extends StatefulWidget {
  static const route = '/auth/register';

  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Register')),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        children: [
          TextFormField(
            controller: _emailController,
            decoration: const InputDecoration(
              label: Text('Email'),
            ),
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _passwordController,
            decoration: const InputDecoration(
              label: Text('Password'),
            ),
            obscureText: true,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () async {
              try {
                setState(() {
                  _isLoading = true;
                });
                final email = _emailController.text.trim();
                final password = _passwordController.text.trim();
                await supabase.auth.signUp(
                  email: email,
                  password: password,
                  emailRedirectTo:
                      'mfa-app://callback${MFAEnrollPage.route}', // redirect the user to setup MFA page after email confirmation
                );
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Check your inbox.')));
                }
              } on AuthException catch (error) {
                ScaffoldMessenger.of(context)
                    .showSnackBar(SnackBar(content: Text(error.message)));
              } catch (error) {
                ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Unexpected error occurred')));
              }
              if (mounted) {
                setState(() {
                  _isLoading = false;
                });
              }
            },
            child: _isLoading
                ? const SizedBox(
                    height: 24,
                    width: 24,
                    child: Center(
                        child: CircularProgressIndicator(color: Colors.white)),
                  )
                : const Text('Register'),
          ),
          const SizedBox(height: 16),
          TextButton(
            onPressed: () => context.push(LoginPage.route),
            child: const Text('I already have an account'),
          )
        ],
      ),
    );
  }
}
