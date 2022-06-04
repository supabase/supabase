import 'dart:convert';

import 'package:todosupabase/functions/auth.dart';

class CrudSupabase {
  static Future<dynamic> getUser({required String email}) async {
    final res = await AuthSupabase.client
        .from('Users')
        .select()
        .eq("email", email)
        .execute();
    final data = res.data;
    final error = res.error;
    print(data);
    return data;
  }

  static Future<List<dynamic>> getTodo() async {
    final res = await AuthSupabase.client
        .from('Todo')
        .select()
        .eq("email", AuthSupabase.client.auth.currentUser!.email.toString())
        .execute();
    final data = res.data;
    final error = res.error;
    return data;
  }

  static Future<dynamic> addTodo(
      {required String task, required String due}) async {
    final res = await AuthSupabase.client.from('Todo').insert({
      "email": AuthSupabase.client.auth.currentUser!.email.toString(),
      "task": task,
      "due": due,
      "done": false
    }).execute();
    final data = res.data;
    final error = res.error;
    print(data);
    return data;
  }

  static Future<void> deleteTodo({required String id}) async {
    final res =
        await AuthSupabase.client.from('Todo').delete().eq("id", id).execute();
    final data = res.data;
    final error = res.error;
    print(data);
    return data;
  }

  static Future<void> taskDone(
      {required String id, required bool value}) async {
    final res = await AuthSupabase.client
        .from('Todo')
        .update({"done": value})
        .eq("id", id)
        .execute();
    final data = res.data;
    final error = res.error;
    print(data);
    return data;
  }

  static Future<void> editTask(
      {required String id, required String due, required String task}) async {
    final res = await AuthSupabase.client
        .from('Todo')
        .update({"due": due, "task": task})
        .eq("id", id)
        .execute();
    final data = res.data;
    final error = res.error;
    print(data);
    return data;
  }

  static Future<dynamic> addUser(
      {required String name, required String email}) async {
    final res = await AuthSupabase.client.from('Users').insert({
      "name": name,
      "email": email,
    }).execute();
    print("adding number");
    final data = res.data;
    final error = res.error;
    print(data);
    print(error);
  }
}
