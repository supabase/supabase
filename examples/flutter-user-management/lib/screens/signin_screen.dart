import 'package:supabase_demo/components/auth_state.dart';
import 'package:supabase_demo/utils/helpers.dart';
import 'package:flutter/material.dart';
import 'package:supabase_demo/utils/constants.dart';
import 'package:rounded_loading_button/rounded_loading_button.dart';
import 'package:supabase/supabase.dart' as supabase;
import 'package:supabase_flutter/supabase_flutter.dart';

class SignInScreen extends StatefulWidget {
  @override
  _SignInState createState() => _SignInState();
}

class _SignInState extends AuthState<SignInScreen> {
  final formKey = GlobalKey<FormState>();
  final scaffoldKey = GlobalKey<ScaffoldState>();

  final RoundedLoadingButtonController _magicLinkController =
      RoundedLoadingButtonController();

  String _email = '';

  @override
  void onErrorAuthenticating(String message) {
    showMessage(message);
  }

  Future<bool> _onMagicLinkPress(BuildContext context) async {
    final form = formKey.currentState;

    if (form != null && form.validate()) {
      form.save();
      FocusScope.of(context).unfocus();

      final response = await Supabase().client.auth.signIn(
            email: _email,
            options: supabase.AuthOptions(
              redirectTo: authRedirectUri,
            ),
          );
      if (response.error != null) {
        showMessage(response.error!.message);
        _magicLinkController.reset();
      } else {
        showMessage('Check your email for the login link!');
      }
    } else {
      _magicLinkController.reset();
    }
    return true;
  }

  void showMessage(String message) {
    final snackbar = SnackBar(content: Text(message));
    ScaffoldMessenger.of(scaffoldKey.currentContext!).showSnackBar(snackbar);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: scaffoldKey,
      resizeToAvoidBottomInset: false,
      appBar: AppBar(
        title: const Text('Sign in'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(15.0),
        child: Form(
          key: formKey,
          child: Column(
            children: <Widget>[
              const SizedBox(height: 25.0),
              TextFormField(
                onSaved: (value) => _email = value ?? '',
                validator: (val) => validateEmail(val),
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  hintText: 'Enter your email address',
                ),
              ),
              const SizedBox(height: 50.0),
              RoundedLoadingButton(
                color: Colors.green,
                controller: _magicLinkController,
                onPressed: () {
                  _onMagicLinkPress(context);
                },
                child: const Text(
                  'Send magic link',
                  style: TextStyle(fontSize: 20, color: Colors.white),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
