import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:todosupabase/constant.dart';
import 'package:todosupabase/functions/auth.dart';

class SignInPage extends StatefulWidget {
  const SignInPage({Key? key}) : super(key: key);

  @override
  State<SignInPage> createState() => _SignInPageState();
}

class _SignInPageState extends State<SignInPage> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool loading = false;
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 300),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SvgPicture.asset("assets/supabase-dark.svg", width: 200),
              largeGap,
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
              loading
                  ? Container(
                      height: 50,
                      width: 50,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(50),
                      ),
                      child: const Center(
                        child: CircularProgressIndicator(),
                      ),
                    )
                  : ElevatedButton(
                      child: const Text("Sign In"),
                      onPressed: () async {
                        setState(() {
                          loading = true;
                        });
                        var value = await AuthSupabase.loginUser(
                            email: _emailController.text,
                            password: _passwordController.text);
                        setState(() {
                          loading = false;
                        });
                        if (value != null) {
                          Navigator.pushReplacementNamed(context, '/todo');
                        } else {
                          snackbarAlert(
                              context: context,
                              message: "Invalid Email or Password");
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
