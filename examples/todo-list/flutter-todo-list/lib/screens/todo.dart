import 'package:flutter/material.dart';
import 'package:todosupabase/constant.dart';

class TodoPage extends StatefulWidget {
  const TodoPage({Key? key}) : super(key: key);

  @override
  State<TodoPage> createState() => _TodoPageState();
}

class _TodoPageState extends State<TodoPage> {
  String userName = '';
  bool loading = true;
  List<dynamic> todos = [];
  final TextEditingController _taskEditingController = TextEditingController();
  final TextEditingController _dueEditingController = TextEditingController();
  Future logOut(BuildContext context) async {
    await client.auth.signOut();
  }

  // GET THE USER DETAILS
  Future<dynamic> getUser({required String email}) async {
    final res =
        await client.from('Users').select().eq('email', email).execute();
    final data = res.data;
    return data;
  }

  // GETR THE TODOS
  Future<List<dynamic>> getTodo() async {
    final res = await client
        .from('Todo')
        .select('*')
        .eq('email', client.auth.currentUser!.email.toString())
        .order('id')
        .execute();
    final data = res.data;
    return data;
  }

  // ADD A Todo IN THE DB
  Future<dynamic> addTodo({
    required String task,
    required String due,
  }) async {
    final res = await client.from('Todo').insert({
      'email': client.auth.currentUser!.email.toString(),
      'task': task,
      'due': due,
      'done': false
    }).execute();
    final data = res.data;
    return data;
  }

  // DELETE A Todo IN THE DB
  Future<void> deleteTodo({required String id}) async {
    try {
      await client.from('Todo').delete().eq('id', id).execute();
    } catch (e) {
      print(e);
    }
  }

  // toggle a Todo IN THE DB
  Future<void> taskDone({
    required String id,
    required bool value,
  }) async {
    final res = await client
        .from('Todo')
        .update({'done': value})
        .eq('id', id)
        .execute();
    final data = res.data;
    return data;
  }

  // Edit a Todo IN THE DB
  Future<void> editTask({
    required String id,
    required String due,
    required String task,
  }) async {
    final res = await client
        .from('Todo')
        .update({'due': due, 'task': task})
        .eq('id', id)
        .execute();
    final data = res.data;
    return data;
  }

  Future<void> initFunc() async {
    var nameVal =
        await getUser(email: client.auth.currentUser!.email.toString());
    setState(() {
      userName = nameVal[0]['name'];
    });
    List<dynamic> value = await getTodo();
    for (var element in value) {
      todos.add(element);
    }
    setState(() {
      loading = false;
    });
  }

  @override
  void initState() {
    initFunc();
    super.initState();
  }

  @override
  void dispose() {
    super.dispose();
    _taskEditingController.dispose();
    _dueEditingController.dispose();
  }

  Future<void> displayTextInputDialog({
    required BuildContext context,
    void Function()? onTab,
    required TextEditingController taskCtrl,
    required TextEditingController dueCtrl,
  }) async {
    return showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Add a todo'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: taskCtrl,
                decoration:
                    const InputDecoration(hintText: 'Add title of todo'),
              ),
              TextField(
                controller: dueCtrl,
                keyboardType: TextInputType.datetime,
                decoration:
                    const InputDecoration(hintText: 'Add Due Date in DD/MM'),
              ),
              smallGap,
              MaterialButton(
                onPressed: onTab,
                child: const Text(
                  'Add Task',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                color: const Color(0xff33b27b),
              )
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.black,
        automaticallyImplyLeading: false,
        title: Text('Hey $userName, add todo'),
        actions: <Widget>[
          IconButton(
            icon: const Icon(Icons.exit_to_app),
            onPressed: () async {
              await logOut(context);
              Navigator.pop(context, '/');
            },
          ),
        ],
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : ConstrainedBox(
              constraints: const BoxConstraints(),
              child: todos.isEmpty
                  ? const Center(
                      child: Text('No Task, add new task'),
                    )
                  : ListView.builder(
                      itemCount: todos.length,
                      itemBuilder: (context, index) {
                        return ListTile(
                          //Long Press to edit
                          onLongPress: () {
                            displayTextInputDialog(
                              context: context,
                              taskCtrl: _taskEditingController,
                              dueCtrl: _dueEditingController,
                              onTab: () async {
                                await editTask(
                                  id: todos[index]['id'].toString(),
                                  due: _dueEditingController.text,
                                  task: _taskEditingController.text,
                                );
                                Navigator.pop(context);
                                setState(() {
                                  loading = true;
                                });
                                List<dynamic> value = await getTodo();
                                todos.clear();
                                setState(() {});
                                for (var element in value) {
                                  todos.add(element);
                                }
                                setState(() {
                                  loading = false;
                                });
                              },
                            );
                          },
                          title: Text(
                            todos[index]['task'],
                            style: const TextStyle(color: Colors.white),
                          ),
                          subtitle: Text(
                            todos[index]['due'],
                            style: const TextStyle(color: Colors.white),
                          ),
                          leading: GestureDetector(
                            onTap: () async {
                              setState(() {
                                loading = true;
                              });
                              await deleteTodo(
                                id: todos[index]['id'].toString(),
                              );
                              List<dynamic> value = await getTodo();
                              todos.clear();
                              setState(() {});
                              for (var element in value) {
                                todos.add(element);
                              }
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
                              await taskDone(
                                id: todos[index]['id'].toString(),
                                value: !todos[index]['done'],
                              );
                              List<dynamic> value = await getTodo();
                              todos.clear();
                              setState(() {});
                              for (var element in value) {
                                todos.add(element);
                              }
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
                                color: todos[index]['done']
                                    ? const Color(0xff33b27b)
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(5),
                              ),
                              child: todos[index]['done']
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
                    ),
            ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xff33b27b),
        child: const Icon(Icons.add),
        onPressed: () {
          displayTextInputDialog(
            context: context,
            taskCtrl: _taskEditingController,
            dueCtrl: _dueEditingController,
            onTab: () async {
              await addTodo(
                task: _taskEditingController.text,
                due: _dueEditingController.text,
              );
              Navigator.pop(context);
              setState(() {
                loading = true;
              });

              List<dynamic> value = await getTodo();
              todos.clear();
              setState(() {});
              for (var element in value) {
                todos.add(element);
              }
              setState(() {
                loading = false;
              });
            },
          );
        },
      ),
    );
  }
}
