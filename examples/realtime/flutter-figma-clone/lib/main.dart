import 'package:canvas/auth/login_page.dart';
import 'package:canvas/canvas/canvas_page.dart';
import 'package:canvas/project/projects_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_web_plugins/url_strategy.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_auth_ui/supabase_auth_ui.dart';

void main() async {
  usePathUrlStrategy();

  await Supabase.initialize(
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY',
  );
  runApp(const MyApp());
}

final supabase = Supabase.instance.client;

final _router = GoRouter(
  initialLocation: '/signin',
  routes: [
    GoRoute(
      path: '/signin',
      builder: (context, state) => const LoginPage(),
    ),
    GoRoute(
      path: '/projects',
      builder: (context, state) => const ProjectsPage(),
    ),
    GoRoute(
      path: '/canvas/:projectId',
      builder: (context, state) =>
          CanvasPage(state.pathParameters['projectId']!),
    ),
  ],
  redirect: (BuildContext context, GoRouterState state) {
    final isSignedIn = supabase.auth.currentSession != null;
    if (state.path != '/signin') {
      if (!isSignedIn) {
        return '/signin';
      }
    } else {
      if (isSignedIn) {
        return '/projects';
      }
    }
    return null;
  },
);

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Figma Clone',
      debugShowCheckedModeBanner: false,
      routerConfig: _router,
    );
  }
}
