import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mfa_app/pages/auth/login_page.dart';
import 'package:mfa_app/pages/auth/register_page.dart';
import 'package:mfa_app/pages/home_page.dart';
import 'package:mfa_app/pages/list_mfa_page.dart';
import 'package:mfa_app/pages/mfa/verify_page.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:mfa_app/pages/mfa/enroll_page.dart';

void main() async {
  await Supabase.initialize(
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_ANON_KEY',
  );
  runApp(const MyApp());
}

/// Extract SupabaseClient instance in a handy variable
final supabase = Supabase.instance.client;

final _router = GoRouter(
  routes: [
    GoRoute(
      path: HomePage.route,
      builder: (context, state) => const HomePage(),
    ),
    GoRoute(
      path: ListMFAPage.route,
      builder: (context, state) => ListMFAPage(),
    ),
    GoRoute(
      path: LoginPage.route,
      builder: (context, state) => const LoginPage(),
    ),
    GoRoute(
      path: RegisterPage.route,
      builder: (context, state) => const RegisterPage(),
    ),
    GoRoute(
      path: MFAEnrollPage.route,
      builder: (context, state) => const MFAEnrollPage(),
    ),
    GoRoute(
      path: MFAVerifyPage.route,
      builder: (context, state) => const MFAVerifyPage(),
    ),
  ],
  redirect: (context, state) async {
    // Any users can visit the /auth route
    if (state.location.contains('/auth') == true) {
      return null;
    }

    final session = supabase.auth.currentSession;
    // A user without a session should be redirected to the register page
    if (session == null) {
      return RegisterPage.route;
    }

    final assuranceLevelData =
        supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    // The user has not setup MFA yet, so send them to enroll MFA page.
    if (assuranceLevelData.currentLevel == AuthenticatorAssuranceLevels.aal1) {
      await supabase.auth.refreshSession();
      final nextLevel =
          supabase.auth.mfa.getAuthenticatorAssuranceLevel().nextLevel;
      if (nextLevel == AuthenticatorAssuranceLevels.aal2) {
        // The user has already setup MFA, but haven't login via MFA
        // Redirect them to the verify page
        return MFAVerifyPage.route;
      } else {
        // The user has not yet setup MFA
        // Redirect them to the enrollment page
        return MFAEnrollPage.route;
      }
    }

    // The user has signed invia MFA, and is allowed to view any page.
    return null;
  },
);

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'MFA App',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.light().copyWith(
        inputDecorationTheme: const InputDecorationTheme(
          border: OutlineInputBorder(),
        ),
      ),
      routerConfig: _router,
    );
  }
}
