import 'package:flutter/material.dart';
import 'package:todosupabase/constant.dart';
import 'package:todosupabase/functions/auth.dart';
import 'package:todosupabase/functions/crud.dart';

class TodoPage extends StatefulWidget {
  const TodoPage({Key? key}) : super(key: key);

  @override
  State<TodoPage> createState() => _TodoPageState();
}

class _TodoPageState extends State<TodoPage> {
  String userName = "";
  bool loading = true;
  List<dynamic> todos = [];
  @override
  void initState() {
    // TODO: implement initState
    super.initState();
    CrudSupabase.getUser(
            email: AuthSupabase.client.auth.currentUser!.email.toString())
        .then((value) {
      setState(() {
        userName = value[0]['name'];
      });
    });
    CrudSupabase.getTodo().then((value) {
      value.forEach((element) {
        todos.add(element);
      });
    });
    setState(() {
      loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final TextEditingController _taskEditingController =
        TextEditingController();
    final TextEditingController _dueEditingController = TextEditingController();
    return Scaffold(
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xff33b27b),
        onPressed: () {
          displayTextInputDialog(context, () {
            CrudSupabase.addTodo(
              task: _taskEditingController.text,
              due: _dueEditingController.text,
            ).then((value) {
              Navigator.pop(context);
              setState(() {
                loading = true;
              });
              CrudSupabase.getTodo().then((value) {
                todos.clear();
                setState(() {});
                value.forEach((element) {
                  todos.add(element);
                });
              });
              setState(() {
                loading = false;
              });
            });
          }, _taskEditingController, _dueEditingController);
        },
        child: const Icon(Icons.add),
      ),
      appBar: AppBar(
        backgroundColor: Colors.black,
        automaticallyImplyLeading: false,
        title: Text('Hey ${userName.split(" ")[0]}, add todo'),
        actions: <Widget>[
          IconButton(
            icon: const Icon(Icons.exit_to_app),
            onPressed: () {
              AuthSupabase.logOut(context);
            },
          ),
        ],
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : SizedBox(
              height: double.infinity,
              width: double.infinity,
              child: todos.isEmpty
                  ? const Center(
                      child: Text("No Task, add new task"),
                    )
                  : Column(
                      mainAxisAlignment: MainAxisAlignment.start,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: todos
                          .map(
                            (e) => ListTile(
                              //Long Press to edit
                              onLongPress: () {
                                displayTextInputDialog(context, () {
                                  CrudSupabase.editTask(
                                          id: e["id"].toString(),
                                          due: _dueEditingController.text,
                                          task: _taskEditingController.text)
                                      .then((value) {
                                    Navigator.pop(context);
                                    setState(() {
                                      loading = true;
                                    });
                                    CrudSupabase.getTodo().then((value) {
                                      todos.clear();
                                      setState(() {});
                                      value.forEach((element) {
                                        todos.add(element);
                                      });
                                    });
                                    setState(() {
                                      loading = false;
                                    });
                                  });
                                }, _taskEditingController,
                                    _dueEditingController);
                              },
                              title: Text(
                                e["task"],
                                style: TextStyle(color: Colors.white),
                              ),
                              subtitle: Text(
                                e["due"],
                                style: TextStyle(color: Colors.white),
                              ),
                              leading: GestureDetector(
                                onTap: () {
                                  setState(() {
                                    loading = true;
                                  });
                                  CrudSupabase.deleteTodo(
                                          id: e["id"].toString())
                                      .then((value) {
                                    print("delteed");
                                    CrudSupabase.getTodo().then((value) {
                                      todos.clear();
                                      setState(() {});
                                      value.forEach((element) {
                                        todos.add(element);
                                      });
                                    });
                                    setState(() {
                                      loading = false;
                                    });
                                  });
                                },
                                child: const Icon(
                                  Icons.delete,
                                  color: Colors.white,
                                ),
                              ),
                              trailing: GestureDetector(
                                onTap: () {
                                  setState(() {
                                    loading = true;
                                  });
                                  CrudSupabase.taskDone(
                                          id: e["id"].toString(),
                                          value: !e["done"])
                                      .then((value) {
                                    CrudSupabase.getTodo().then((value) {
                                      todos.clear();
                                      setState(() {});
                                      value.forEach((element) {
                                        todos.add(element);
                                      });
                                      setState(() {
                                        loading = false;
                                      });
                                    });
                                  });
                                },
                                child: Container(
                                  height: 25,
                                  width: 25,
                                  decoration: BoxDecoration(
                                    border: Border.all(
                                      color: const Color(0xff33b27b),
                                      width: 2,
                                    ),
                                    color: e["done"]
                                        ? const Color(0xff33b27b)
                                        : Colors.transparent,
                                    borderRadius: BorderRadius.circular(5),
                                  ),
                                  child: e["done"]
                                      ? const Center(
                                          child: Icon(
                                            Icons.done,
                                            size: 15,
                                            color: Colors.white,
                                          ),
                                        )
                                      : const SizedBox(),
                                ),
                              ),
                            ),
                          )
                          .toList(),
                    ),
            ),
    );
  }
}
