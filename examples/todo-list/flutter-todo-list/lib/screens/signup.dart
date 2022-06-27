import 'package:flutter/material.dart';
import 'package:todosupabase/constant.dart';

class SignUpPage extends StatefulWidget {
  const SignUpPage({Key? key}) : super(key: key);

  @override
  State<SignUpPage> createState() => _SignUpPageState();
}

class _SignUpPageState extends State<SignUpPage> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _nameController = TextEditingController();

  Future<bool> createAccount({
    required String email,
    required String password,
  }) async {
    final res = await client.auth.signUp(email, password);
    final error = res.error;
    if (error == null) {
      return true;
    } else {
      return false;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 300),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Image.asset(
                'assets/supabase-logo.png',
                height: 40,
              ),
              largeGap,
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  label: Text('Username'),
                ),
              ),
              smallGap,
              TextFormField(
                controller: _emailController,
                decoration: const InputDecoration(
                  label: Text('Email'),
                ),
                keyboardType: TextInputType.emailAddress,
              ),
              smallGap,
              TextFormField(
                controller: _passwordController,
                decoration: const InputDecoration(
                  label: Text('Password'),
                ),
                obscureText: true,
              ),
              smallGap,
              ElevatedButton(
                child: const Text('Sign Up'),
                onPressed: () async {
                  final value = await createAccount(
                    email: _emailController.text,
                    password: _passwordController.text,
                  );
                  if (value == true) {
                    Navigator.pushReplacementNamed(context, '/signin');
                  }
                },
              )
            ],
          ),
        ),
      ),
    );
  }
}
