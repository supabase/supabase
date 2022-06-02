import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class AuthSupabase {
  static final client = SupabaseClient(
      "https://newknrbzotfpvatooqxz.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ld2tucmJ6b3RmcHZhdG9vcXh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTQwMjM2ODYsImV4cCI6MTk2OTU5OTY4Nn0.KI6TzzzailhNRfRAeJMIDtMVZSBZbaliDK2K_J0VVn8");
  static Future<bool> createAccount(
      {required String email, required String password}) async {
    final res = await client.auth.signUp(email, password);
    final user = res.data?.user;
    final error = res.error;
    print(user);
    print(error);
    if (error == null) {
      return true;
    } else {
      return false;
    }
  }

  static Future<String?> loginUser(
      {required String email, required String password}) async {
    final res = await client.auth.signIn(email: email, password: password);
    final user = res.data?.user;
    final error = res.error;
    return user?.id;
  }

  static logOut(BuildContext context) async {
    await client.auth.signOut();
    Navigator.pushNamed(context, '/');
  }
}
