import 'package:flutter/material.dart';

const smallGap = SizedBox(height: 20);
const largeGap = SizedBox(height: 40);

Future<void> displayTextInputDialog(
  BuildContext context,
  Function()? onTab,
  TextEditingController taskCtrl,
  TextEditingController dueCtrl,
) async {
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
                    const InputDecoration(hintText: "Add title of todo"),
              ),
              TextField(
                controller: dueCtrl,
                keyboardType: TextInputType.datetime,
                decoration:
                    const InputDecoration(hintText: "Add Due Date in DD/MM"),
              ),
              smallGap,
              MaterialButton(
                onPressed: onTab,
                child: const Text("Add Task",
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    )),
                color: const Color(0xff33b27b),
              )
            ],
          ),
        );
      });
}

ScaffoldFeatureController<SnackBar, SnackBarClosedReason> snackbarAlert(
    {required BuildContext context, required String message}) {
  return ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message),
      duration: const Duration(seconds: 2),
      backgroundColor: Colors.red,
    ),
  );
}
