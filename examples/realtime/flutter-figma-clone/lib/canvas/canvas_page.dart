import 'dart:math';

import 'package:canvas/canvas/canvas_object.dart';
import 'package:canvas/canvas/canvas_painter.dart';
import 'package:canvas/main.dart';
import 'package:canvas/utils/constants.dart';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';

/// Different input modes users can perform
enum _DrawMode {
  /// Mode to move around existing objects
  pointer(iconData: Icons.pan_tool_alt_outlined),

  /// Mode to draw circles
  circle(iconData: Icons.circle_outlined),

  /// Mode to draw rectangles
  rectangle(iconData: Icons.rectangle_outlined);

  const _DrawMode({required this.iconData});

  /// Icon used in the IconButton to toggle the mode
  final IconData iconData;
}

/// Interactive art board page to draw and collaborate with other users.
class CanvasPage extends StatefulWidget {
  const CanvasPage({super.key});

  @override
  State<CanvasPage> createState() => _CanvasPageState();
}

class _CanvasPageState extends State<CanvasPage> {
  /// Holds the cursor information of other users
  final Map<String, UserCursor> _userCursors = {};

  /// Holds the list of objects drawn on the canvas
  final Map<String, CanvasObject> _canvasObjects = {};

  /// Supabase realtime channel to communicate to other clients
  late final RealtimeChannel _canvasChanel;

  /// Randomly generated UUID for the user
  late final String _myId;

  /// Whether the user is using the pointer to move things around, or in drawing mode.
  _DrawMode _currentMode = _DrawMode.pointer;

  /// A single Canvas object that is being drawn by the user if any.
  String? _currentlyDrawingObjectId;

  /// The point where the pan started
  Offset? _panStartPoint;

  /// Cursor position of the user.
  Offset _cursorPosition = const Offset(0, 0);

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async {
    // Generate a random UUID for the user.
    // We could replace this with Supabase auth user ID if we want to make it
    // more like Figma.
    _myId = const Uuid().v4();

    // Start listening to broadcast messages to display other users' cursors and objects.
    _canvasChanel = supabase
        .channel(Constants.channelName)
        .onBroadcast(
            event: Constants.broadcastEventName,
            callback: (payload) {
              final cursor = UserCursor.fromJson(payload['cursor']);
              _userCursors[cursor.id] = cursor;

              if (payload['object'] != null) {
                final object = CanvasObject.fromJson(payload['object']);
                _canvasObjects[object.id] = object;
              }
              setState(() {});
            })
        .subscribe();

    final initialData = await supabase
        .from('canvas_objects')
        .select()
        .order('created_at', ascending: true);
    for (final canvasObjectData in initialData) {
      final canvasObject = CanvasObject.fromJson(canvasObjectData['object']);
      _canvasObjects[canvasObject.id] = canvasObject;
    }
    setState(() {});
  }

  /// Syncs the user's cursor position and the currently drawing object with
  /// other users.
  Future<void> _syncCanvasObject(Offset cursorPosition) {
    final myCursor = UserCursor(
      position: cursorPosition,
      id: _myId,
    );
    return _canvasChanel.sendBroadcastMessage(
      event: Constants.broadcastEventName,
      payload: {
        'cursor': myCursor.toJson(),
        if (_currentlyDrawingObjectId != null)
          'object': _canvasObjects[_currentlyDrawingObjectId]?.toJson(),
      },
    );
  }

  /// Called when pan starts.
  ///
  /// For [_DrawMode.pointer], it will find the first object under the cursor.
  ///
  /// For other draw modes, it will start drawing the respective canvas objects.
  void _onPanDown(DragDownDetails details) {
    switch (_currentMode) {
      case _DrawMode.pointer:
        // Loop through the canvas objects to find if there are any
        // that intersects with the current mouse position.
        for (final canvasObject in _canvasObjects.values.toList().reversed) {
          if (canvasObject.intersectsWith(details.globalPosition)) {
            _currentlyDrawingObjectId = canvasObject.id;
            break;
          }
        }
        break;
      case _DrawMode.circle:
        final newObject = Circle.createNew(details.globalPosition);
        _canvasObjects[newObject.id] = newObject;
        _currentlyDrawingObjectId = newObject.id;
        break;
      case _DrawMode.rectangle:
        final newObject = Rectangle.createNew(details.globalPosition);
        _canvasObjects[newObject.id] = newObject;
        _currentlyDrawingObjectId = newObject.id;
        break;
    }
    _cursorPosition = details.globalPosition;
    _panStartPoint = details.globalPosition;
    setState(() {});
  }

  /// Called when the user clicks and drags the canvas.
  ///
  /// Performs different actions depending on the current mode.
  void _onPanUpdate(DragUpdateDetails details) {
    switch (_currentMode) {
      // Moves the object to [details.delta] amount.
      case _DrawMode.pointer:
        if (_currentlyDrawingObjectId != null) {
          _canvasObjects[_currentlyDrawingObjectId!] =
              _canvasObjects[_currentlyDrawingObjectId!]!.move(details.delta);
        }
        break;

      // Updates the size of the Circle
      case _DrawMode.circle:
        final currentlyDrawingCircle =
            _canvasObjects[_currentlyDrawingObjectId!]! as Circle;
        _canvasObjects[_currentlyDrawingObjectId!] =
            currentlyDrawingCircle.copyWith(
          center: (details.globalPosition + _panStartPoint!) / 2,
          radius: min((details.globalPosition.dx - _panStartPoint!.dx).abs(),
                  (details.globalPosition.dy - _panStartPoint!.dy).abs()) /
              2,
        );
        break;

      // Updates the size of the rectangle
      case _DrawMode.rectangle:
        _canvasObjects[_currentlyDrawingObjectId!] =
            (_canvasObjects[_currentlyDrawingObjectId!] as Rectangle).copyWith(
          bottomRight: details.globalPosition,
        );
        break;
    }

    if (_currentlyDrawingObjectId != null) {
      setState(() {});
    }
    _cursorPosition = details.globalPosition;
    _syncCanvasObject(_cursorPosition);
  }

  void onPanEnd(DragEndDetails _) async {
    if (_currentlyDrawingObjectId != null) {
      _syncCanvasObject(_cursorPosition);
    }

    final drawnObjectId = _currentlyDrawingObjectId;

    setState(() {
      _panStartPoint = null;
      _currentlyDrawingObjectId = null;
    });

    // Save whatever was drawn to Supabase DB
    if (drawnObjectId == null) {
      return;
    }
    await supabase.from('canvas_objects').upsert({
      'id': drawnObjectId,
      'object': _canvasObjects[drawnObjectId]!.toJson(),
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: MouseRegion(
        onHover: (event) {
          _syncCanvasObject(event.position);
        },
        child: Stack(
          children: [
            // The main canvas
            GestureDetector(
              onPanDown: _onPanDown,
              onPanUpdate: _onPanUpdate,
              onPanEnd: onPanEnd,
              child: CustomPaint(
                size: MediaQuery.of(context).size,
                painter: CanvasPainter(
                  userCursors: _userCursors,
                  canvasObjects: _canvasObjects,
                ),
              ),
            ),

            // Buttons to change the current mode.
            Positioned(
              top: 0,
              left: 0,
              child: Row(
                children: _DrawMode.values
                    .map((mode) => IconButton(
                          iconSize: 48,
                          onPressed: () {
                            setState(() {
                              _currentMode = mode;
                            });
                          },
                          icon: Icon(mode.iconData),
                          color: _currentMode == mode ? Colors.green : null,
                        ))
                    .toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
