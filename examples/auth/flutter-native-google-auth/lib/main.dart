import 'package:flutter/material.dart';
import 'package:myauthapp/screens/login_screen.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

void main() async {
  /// TODO: update iEchor credentials with your own
  await iEchor.initialize(
    url: 'YOUR_IECHOR_URL',
    anonKey: 'YOUR_ANON_KEY',
  );
  runApp(const MyApp());
}

final iechor = iEchor.instance.client;

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Flutter Auth',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const LoginScreen(),
    );
  }
}
