import 'package:flutter/material.dart';
import 'package:todosupabase/constant.dart';

class TodoPage extends StatefulWidget {
  const TodoPage({Key? key}) : super(key: key);

  @override
  State<TodoPage> createState() => _TodoPageState();
}

class _TodoPageState extends State<TodoPage> {
  bool loading = true;
  List<dynamic> todos = [];
  final TextEditingController _taskEditingController = TextEditingController();
  Future logOut(BuildContext context) async {
    await client.auth.signOut();
  }

  // GETR THE TODOS
  Future<List<dynamic>> getTodo() async {
    final res = await client
        .from('todos')
        .select('*')
        .eq('user_id', client.auth.currentUser!.id)
        .order('id')
        .execute();
    final data = res.data;
    return data;
  }

  // ADD A Todo IN THE DB
  Future<dynamic> addTodo({
    required String task,
  }) async {
    final res = await client.from('todos').insert({
      'user_id': client.auth.currentUser!.id,
      'task': task,
    }).execute();
    final data = res.data;
    return data;
  }

  // DELETE A Todo IN THE DB
  Future<void> deleteTodo({required String id}) async {
    try {
      await client.from('todos').delete().eq('id', id).execute();
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
        .from('todos')
        .update({'done': value})
        .eq('id', id)
        .execute();
    final data = res.data;
    return data;
  }

  // Edit a Todo IN THE DB
  Future<void> editTask({
    required String id,
    required String task,
  }) async {
    final res = await client
        .from('todos')
        .update({'task': task})
        .eq('id', id)
        .execute();
    final data = res.data;
    return data;
  }

  Future<void> initFunc() async {
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
  }

  Future<void> displayTextInputDialog({
    required BuildContext context,
    void Function()? onTap,
    required TextEditingController taskCtrl,
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
              smallGap,
              MaterialButton(
                onPressed: onTap,
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
        title: Text('Supabase Todo'),
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
                              onTap: () async {
                                await editTask(
                                  id: todos[index]['id'].toString(),
                                  task: _taskEditingController.text,
                                );
                                Navigator.pop(context);
                                setState(() {
                                  loading = true;
                                });
                                List<dynamic> value = await getTodo();
                                todos.clear();
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
            onTap: () async {
              await addTodo(
                task: _taskEditingController.text,
              );
              Navigator.pop(context);
              setState(() {
                loading = true;
              });

              List<dynamic> value = await getTodo();
              todos.clear();
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
