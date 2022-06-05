import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:todosupabase/constant.dart';
import 'package:todosupabase/functions/auth.dart';
import 'package:todosupabase/functions/crud.dart';

class SignUpPage extends StatefulWidget {
  const SignUpPage({Key? key}) : super(key: key);

  @override
  State<SignUpPage> createState() => _SignUpPageState();
}

class _SignUpPageState extends State<SignUpPage> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _nameController = TextEditingController();
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
              SvgPicture.asset('assets/supabase-dark.svg', width: 200),
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
                  final value = await AuthSupabase.createAccount(
                    email: _emailController.text,
                    password: _passwordController.text,
                  );
                  if (value == true) {
                    CrudSupabase.addUser(
                      name: _nameController.text,
                      email: _emailController.text,
                    );
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
