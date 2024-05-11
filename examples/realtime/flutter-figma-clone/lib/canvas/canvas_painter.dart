import 'package:canvas/canvas/canvas_object.dart';
import 'package:flutter/material.dart';

class CanvasPainter extends CustomPainter {
  final Map<String, UserCursor> userCursors;
  final Map<String, CanvasObject> canvasObjects;

  CanvasPainter({
    required this.userCursors,
    required this.canvasObjects,
  });

  @override
  void paint(Canvas canvas, Size size) {
    // Draw each canvas objects
    for (final canvasObject in canvasObjects.values) {
      if (canvasObject is Circle) {
        final position = canvasObject.center;
        final radius = canvasObject.radius;
        canvas.drawCircle(
            position, radius, Paint()..color = canvasObject.color);
      } else if (canvasObject is Rectangle) {
        final position = canvasObject.topLeft;
        final bottomRight = canvasObject.bottomRight;
        canvas.drawRect(
            Rect.fromLTRB(
                position.dx, position.dy, bottomRight.dx, bottomRight.dy),
            Paint()..color = canvasObject.color);
      }
    }

    // Draw the cursors
    for (final userCursor in userCursors.values) {
      final position = userCursor.position;
      canvas.drawPath(
          Path()
            ..moveTo(position.dx, position.dy)
            ..lineTo(position.dx + 14.29, position.dy + 44.84)
            ..lineTo(position.dx + 20.35, position.dy + 25.93)
            ..lineTo(position.dx + 39.85, position.dy + 24.51)
            ..lineTo(position.dx, position.dy),
          Paint()..color = userCursor.color);
    }
  }

  @override
  bool shouldRepaint(oldPainter) => true;
}
