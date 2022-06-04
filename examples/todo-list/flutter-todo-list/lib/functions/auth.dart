import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class AuthSupabase {
  static final client = Supabase.instance.client;
  static Future<bool> createAccount(
      {required String email, required String password}) async {
    final res = await client.auth.signUp(email, password);
    final error = res.error;
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
    return user?.id;
  }

  static Future logOut(BuildContext context) async {
    await client.auth.signOut();
  }
}
