import 'package:todosupabase/functions/auth.dart';

class TodoModel {
  String? task;
  bool done = false;
  String email = AuthSupabase.client.auth.currentUser!.email.toString();
  String? due;
  TodoModel({
    required String task,
    required String due,
  });
}
