import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:todosupabase/constant.dart';
import 'package:todosupabase/screens/signup.dart';
import 'package:todosupabase/screens/signin.dart';
import 'package:todosupabase/screens/todo.dart';

void main() async {
  await Supabase.initialize(
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_KEY',
  );
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: appTheme,
      initialRoute: client.auth.currentSession != null ? '/todo' : '/',
      routes: {
        '/': (context) => const MyHomePage(),
        '/signup': (context) => const SignUpPage(),
        '/signin': (context) => const SignInPage(),
        '/todo': (context) => const TodoPage(),
      },
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({Key? key}) : super(key: key);

  @override
  State<MyHomePage> createState() => MyHomePageState();
}

class MyHomePageState extends State<MyHomePage> {
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
              Image.asset(
                'assets/supabase-logo.png',
                height: 40,
              ),
              largeGap,
              OutlinedButton(
                child: const Text('Sign In'),
                onPressed: () {
                  Navigator.pushNamed(context, '/signin');
                },
              ),
              smallGap,
              OutlinedButton(
                child: const Text('Sign Up'),
                onPressed: () {
                  Navigator.pushNamed(context, '/signup');
                },
              )
            ],
          ),
        ),
      ),
    );
  }
}
