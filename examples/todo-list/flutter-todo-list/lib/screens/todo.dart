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
  final TextEditingController _taskEditingController = TextEditingController();
  final TextEditingController _dueEditingController = TextEditingController();

  void initFunc() async {
    var nameVal = await CrudSupabase.getUser(
        email: AuthSupabase.client.auth.currentUser!.email.toString());
    setState(() {
      userName = nameVal[0]['name'];
    });
    List<dynamic> value = await CrudSupabase.getTodo();
    value.forEach((element) {
      todos.add(element);
    });
    setState(() {
      loading = false;
    });
  }

  @override
  void initState() {
    // TODO: implement initState
    super.initState();
    initFunc();
  }

  @override
  void dispose() {
    super.dispose();
    _taskEditingController.dispose();
    _dueEditingController.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xff33b27b),
        onPressed: () {
          displayTextInputDialog(context, () async {
            await CrudSupabase.addTodo(
              task: _taskEditingController.text,
              due: _dueEditingController.text,
            );
            Navigator.pop(context);
            setState(() {
              loading = true;
            });

            List<dynamic> value = await CrudSupabase.getTodo();
            todos.clear();
            setState(() {});
            value.forEach((element) {
              todos.add(element);
            });
            setState(() {
              loading = false;
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
                  : ListView.builder(
                      itemCount: todos.length,
                      itemBuilder: (context, index) {
                        return ListTile(
                          //Long Press to edit
                          onLongPress: () {
                            displayTextInputDialog(context, () async {
                              await CrudSupabase.editTask(
                                  id: todos[index]["id"].toString(),
                                  due: _dueEditingController.text,
                                  task: _taskEditingController.text);
                              Navigator.pop(context);
                              setState(() {
                                loading = true;
                              });
                              List<dynamic> value =
                                  await CrudSupabase.getTodo();
                              todos.clear();
                              setState(() {});
                              value.forEach((element) {
                                todos.add(element);
                              });
                              setState(() {
                                loading = false;
                              });
                            }, _taskEditingController, _dueEditingController);
                          },
                          title: Text(
                            todos[index]["task"],
                            style: TextStyle(color: Colors.white),
                          ),
                          subtitle: Text(
                            todos[index]["due"],
                            style: TextStyle(color: Colors.white),
                          ),
                          leading: GestureDetector(
                            onTap: () async {
                              setState(() {
                                loading = true;
                              });
                              await CrudSupabase.deleteTodo(
                                  id: todos[index]["id"].toString());
                              List<dynamic> value =
                                  await CrudSupabase.getTodo();
                              todos.clear();
                              setState(() {});
                              value.forEach((element) {
                                todos.add(element);
                              });
                              setState(() {
                                loading = false;
                              });
                            },
                            child: const Icon(
                              Icons.delete,
                              color: Colors.white,
                            ),
                          ),
                          trailing: GestureDetector(
                            onTap: () async {
                              setState(() {
                                loading = true;
                              });
                              await CrudSupabase.taskDone(
                                  id: todos[index]["id"].toString(),
                                  value: !todos[index]["done"]);
                              List<dynamic> value =
                                  await CrudSupabase.getTodo();
                              todos.clear();
                              setState(() {});
                              value.forEach((element) {
                                todos.add(element);
                              });
                              setState(() {
                                loading = false;
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
                                color: todos[index]["done"]
                                    ? const Color(0xff33b27b)
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(5),
                              ),
                              child: todos[index]["done"]
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
                        );
                      },
                    )),
    );
  }
}
