import 'package:supabase_demo/screens/profile_screen.dart';
import 'package:flutter/material.dart';
import 'package:supabase_demo/screens/signin_screen.dart';
import 'package:supabase_demo/screens/splash_screen.dart';
import 'package:supabase_demo/utils/constants.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // init Supabase singleton
  Supabase(
    url: supabaseUrl,
    anonKey: supabaseAnnonKey,
    authCallbackUrlHostname: 'login-callback',
    debug: true,
  );

  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Supabase Demo',
      theme: ThemeData.dark(),
      initialRoute: '/',
      routes: <String, WidgetBuilder>{
        '/': (_) => SplashScreen(),
        '/signIn': (_) => SignInScreen(),
        '/profile': (_) => ProfileScreen(),
      },
    );
  }
}
