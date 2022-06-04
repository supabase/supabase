import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

boxSmall() => const SizedBox(height: 20);
boxLarge() => const SizedBox(height: 40);

Widget buttonCustom(
    {required String text,
    required Function() onPressed,
    required bool filled}) {
  return GestureDetector(
    onTap: onPressed,
    child: Container(
      height: 50,
      width: 300,
      decoration: BoxDecoration(
        color: filled ? Colors.white : Colors.transparent,
        border: Border.all(
          color: Colors.white,
          width: 2,
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Center(
        child: Text(
          text,
          style: TextStyle(
              color: filled ? Colors.black : Colors.white,
              fontWeight: FontWeight.bold),
        ),
      ),
    ),
  );
}

Widget textFeildCustom(String hintText, TextEditingController ctlr) {
  return SizedBox(
    height: 70,
    width: 300,
    child: TextField(
      controller: ctlr,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: const TextStyle(
          color: Colors.white,
        ),
        enabledBorder: OutlineInputBorder(
          borderSide: const BorderSide(
            color: Colors.white,
            width: 2,
          ),
          borderRadius: BorderRadius.circular(20),
        ),
        focusedBorder: OutlineInputBorder(
          borderSide: const BorderSide(
            color: Colors.white,
            width: 2,
          ),
          borderRadius: BorderRadius.circular(20),
        ),
      ),
    ),
  );
}

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
          title: Text('Add a todo'),
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
              boxSmall(),
              MaterialButton(
                onPressed: onTab,
                child: const Text("Add Task",
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    )),
                color: Color(0xff33b27b),
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
