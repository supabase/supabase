import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:todosupabase/constant.dart';
import 'package:todosupabase/functions/auth.dart';
import 'package:todosupabase/screens/signup.dart';
import 'package:todosupabase/screens/signin.dart';
import 'package:todosupabase/screens/todo.dart';

void main() async {
  await Supabase.initialize(
      url: 'https://newknrbzotfpvatooqxz.supabase.co',
      anonKey:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ld2tucmJ6b3RmcHZhdG9vcXh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTQwMjM2ODYsImV4cCI6MTk2OTU5OTY4Nn0.KI6TzzzailhNRfRAeJMIDtMVZSBZbaliDK2K_J0VVn8');
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark(),
      darkTheme: ThemeData(
        scaffoldBackgroundColor: Colors.black,
        textTheme: const TextTheme(
          bodyText1: TextStyle(color: Colors.white),
          bodyText2: TextStyle(color: Colors.white),
        ),
      ),
      initialRoute: "/",
      routes: {
        "/": (context) => const MyHomePage(),
        "/signup": (context) => const SignUpPage(),
        "/signin": (context) => const SignInPage(),
        "/todo": (context) => const TodoPage(),
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
      body: SizedBox(
        height: double.infinity,
        width: double.infinity,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            SvgPicture.asset("assets/supabase-dark.svg", width: 200),
            boxLarge(),
            buttonCustom("Sign In", () {
              Navigator.pushNamed(context, "/signin");
            }, false),
            boxSmall(),
            buttonCustom("Sign Up", () {
              Navigator.pushNamed(context, "/signup");
            }, false)
          ],
        ),
      ),
    );
  }
}
