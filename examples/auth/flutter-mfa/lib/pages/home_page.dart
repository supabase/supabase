import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mfa_app/main.dart';
import 'package:mfa_app/pages/auth/register_page.dart';
import 'package:mfa_app/pages/list_mfa_page.dart';

class HomePage extends StatelessWidget {
  static const route = '/';

  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final privatePostsFuture = supabase.from('private_posts').select();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Home'),
        actions: [
          PopupMenuButton(
            itemBuilder: (context) {
              return [
                PopupMenuItem(
                  child: const Text('Unenroll MFA'),
                  onTap: () {
                    context.push(ListMFAPage.route);
                  },
                ),
                PopupMenuItem(
                  child: const Text('Logout'),
                  onTap: () {
                    supabase.auth.signOut();
                    context.go(RegisterPage.route);
                  },
                ),
              ];
            },
          )
        ],
      ),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: privatePostsFuture,
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(child: Text(snapshot.error.toString()));
          }
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }

          // Display the secure private content upon retrieval
          final data = snapshot.data!;
          return ListView.builder(
            itemCount: data.length,
            itemBuilder: (context, index) {
              return ListTile(title: Text(data[index]['content']));
            },
          );
        },
      ),
    );
  }
}
