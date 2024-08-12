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
    url: 'https://akcrpifcnvufkecfmxqz.supabase.co',
    anonKey:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrY3JwaWZjbnZ1ZmtlY2ZteHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY2MTkxMjIsImV4cCI6MjAyMjE5NTEyMn0.nxkhanVHQ7OJ2bwGU1sgrBb7x3JZiGidlAxnFyiv6Jo',
  );
  runApp(const MyApp());
}

final supabase = Supabase.instance.client;

final _router = GoRouter(
  routes: [
    GoRoute(
      path: '/',
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
