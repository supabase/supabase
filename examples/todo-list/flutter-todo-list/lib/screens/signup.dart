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
      body: SizedBox(
        height: double.infinity,
        width: double.infinity,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            SvgPicture.asset("assets/supabase-dark.svg", width: 200),
            largeGap,
            textFeildCustom(
              "Full Name",
              _nameController,
            ),
            smallGap,
            textFeildCustom(
              "Email",
              _emailController,
            ),
            smallGap,
            textFeildCustom(
              "Password",
              _passwordController,
            ),
            smallGap,
            OutlinedButton(
              child: const Text("Sign Up"),
              onPressed: () async {
                var value = await AuthSupabase.createAccount(
                    email: _emailController.text,
                    password: _passwordController.text);
                if (value == true) {
                  CrudSupabase.addUser(
                      name: _nameController.text, email: _emailController.text);
                  Navigator.pushReplacementNamed(context, "/signin");
                }
              },
            )
          ],
        ),
      ),
    );
  }
}
