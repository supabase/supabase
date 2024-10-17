import 'dart:math';

import 'package:canvas/canvas/canvas_painter.dart';
import 'package:canvas/main.dart';
import 'package:canvas/models/canvas_object.dart';
import 'package:canvas/models/profile.dart';
import 'package:canvas/models/project.dart';
import 'package:canvas/utils/constants.dart';
import 'package:flutter/material.dart';
import 'package:supabase_auth_ui/supabase_auth_ui.dart';

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
  const CanvasPage(
    this.projectId, {
    super.key,
  });

  final String projectId;

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

  /// Username of each users
  String? _myUsername;

  /// Whether the user is using the pointer to move things around, or in drawing mode.
  _DrawMode _currentMode = _DrawMode.pointer;

  /// A single Canvas object that is being drawn by the user if any.
  String? _currentlyDrawingObjectId;

  /// The point where the pan started
  Offset? _panStartPoint;

  /// Cursor position of the user.
  Offset _cursorPosition = const Offset(0, 0);

  Project? _project;

  final TextEditingController _addUserController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  @override
  void dispose() {
    _canvasChanel.unsubscribe();
    _addUserController.dispose();
    super.dispose();
  }

  Future<void> _initialize() async {
    final projectId = widget.projectId;
    // Get the project data
    _project = await supabase
        .from('projects')
        .select('*, profiles(*)')
        .eq('id', widget.projectId)
        .single()
        .withConverter(Project.fromJson);

    // Get the user's username
    final profileMap = await supabase
        .from('profiles')
        .select('username')
        .eq('id', supabase.auth.currentUser!.id)
        .maybeSingle();

    _myUsername = profileMap?['username'] as String;

    // Start listening to broadcast messages to display other users' cursors and objects.
    _canvasChanel = supabase
        .channel(
          projectId,
          opts: const RealtimeChannelConfig(
            private: true,
            ack: true,
          ),
        )
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
        .subscribe((status, error) {
      if (status == RealtimeSubscribeStatus.channelError) {
        debugPrint('Error subscribing to channel: $error');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Error connecting'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    });

    final initialData = await supabase
        .from('canvas_objects')
        .select()
        .eq('project_id', widget.projectId)
        .order('created_at', ascending: true);
    for (final canvasObjectData in initialData) {
      final canvasObject = CanvasObject.fromJson(canvasObjectData['object']);
      _canvasObjects[canvasObject.id] = canvasObject;
    }
    setState(() {});
  }

  /// Syncs the user's cursor position and the currently drawing object with
  /// other users.
  ///
  /// The return value indicates whether the sync was successful or not.
  Future<void> _syncCanvasObject(Offset cursorPosition) async {
    if (_myUsername == null) {
      return;
    }
    final myCursor = UserCursor(
      position: cursorPosition,
      id: _myUsername!,
    );
    await _canvasChanel.sendBroadcastMessage(
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
          if (canvasObject.intersectsWith(details.localPosition)) {
            _currentlyDrawingObjectId = canvasObject.id;
            break;
          }
        }
        break;
      case _DrawMode.circle:
        final newObject = Circle.createNew(details.localPosition);
        _canvasObjects[newObject.id] = newObject;
        _currentlyDrawingObjectId = newObject.id;
        break;
      case _DrawMode.rectangle:
        final newObject = Rectangle.createNew(details.localPosition);
        _canvasObjects[newObject.id] = newObject;
        _currentlyDrawingObjectId = newObject.id;
        break;
    }
    _cursorPosition = details.localPosition;
    _panStartPoint = details.localPosition;
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
          center: (details.localPosition + _panStartPoint!) / 2,
          radius: min((details.localPosition.dx - _panStartPoint!.dx).abs(),
                  (details.localPosition.dy - _panStartPoint!.dy).abs()) /
              2,
        );
        break;

      // Updates the size of the rectangle
      case _DrawMode.rectangle:
        _canvasObjects[_currentlyDrawingObjectId!] =
            (_canvasObjects[_currentlyDrawingObjectId!] as Rectangle).copyWith(
          bottomRight: details.localPosition,
        );
        break;
    }

    if (_currentlyDrawingObjectId != null) {
      setState(() {});
    }
    _cursorPosition = details.localPosition;
    _syncCanvasObject(_cursorPosition);
  }

  void onPanEnd(DragEndDetails _) async {
    final drawnObjectId = _currentlyDrawingObjectId;

    if (_currentlyDrawingObjectId != null) {
      await _syncCanvasObject(_cursorPosition);
    }

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
      'project_id': widget.projectId,
      'object': _canvasObjects[drawnObjectId]!.toJson(),
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
          titleTextStyle: const TextStyle(color: Colors.white),
          title: Text(_project?.name ?? ''),
          leadingWidth: 300,
          backgroundColor: Colors.grey[900],
          leading: Row(
            children: _DrawMode.values
                .map((mode) => IconButton(
                      onPressed: () {
                        setState(() {
                          _currentMode = mode;
                        });
                      },
                      icon: Icon(mode.iconData),
                      color: _currentMode == mode ? Colors.green : Colors.white,
                    ))
                .toList(),
          ),
          // Displays the list of users currently drawing on the canvas
          actions: [
            ...[
              ..._userCursors.values.map((e) => e.id),
              if (_myUsername != null) _myUsername!
            ]
                .map(
                  (id) => Align(
                    widthFactor: 0.8,
                    child: CircleAvatar(
                      backgroundColor: RandomColor.getRandomFromId(id),
                      child: Text(id.substring(0, 2)),
                    ),
                  ),
                )
                .toList(),
            const SizedBox(width: 8),
            TextButton.icon(
              style: TextButton.styleFrom(foregroundColor: Colors.white),
              onPressed: () {
                showDialog(
                    context: context,
                    builder: (context) {
                      return AlertDialog(
                        title: const Text('Share the project'),
                        content: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const ListTile(
                              title: Text('Members'),
                            ),
                            ..._project!.profiles
                                .map((profile) => ListTile(
                                      title: Text(profile.username),
                                      leading: CircleAvatar(
                                        backgroundColor:
                                            RandomColor.getRandomFromId(
                                          profile.username,
                                        ),
                                        child: Text(
                                            profile.username.substring(0, 2)),
                                      ),
                                    ))
                                .toList(),
                            Row(
                              children: [
                                Expanded(
                                  child: TextFormField(
                                    controller: _addUserController,
                                    decoration: const InputDecoration(
                                      hintText: 'Add people with username',
                                    ),
                                  ),
                                ),
                                TextButton(
                                  onPressed: () async {
                                    final username = _addUserController.text;
                                    final profileMap = await supabase
                                        .from('profiles')
                                        .select()
                                        .eq('username', username)
                                        .maybeSingle();
                                    if (profileMap == null) {
                                      ScaffoldMessenger.of(context)
                                          .showSnackBar(const SnackBar(
                                              content: Text('User not found')));
                                      return;
                                    }
                                    final profile =
                                        Profile.fromJson(profileMap);
                                    await supabase
                                        .from('project_members')
                                        .insert({
                                      'project_id': widget.projectId,
                                      'profile_id': profile.id,
                                    });
                                    Navigator.of(context).pop();
                                    ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(
                                            content: Text(
                                                '${profile.username} has been added')));
                                  },
                                  child: const Text('Invite'),
                                ),
                              ],
                            )
                          ],
                        ),
                      );
                    });
              },
              label: const Text('Share'),
              icon: const Icon(Icons.lock),
            ),
            const SizedBox(width: 20),
          ]),
      body: MouseRegion(
        onHover: (event) {
          _syncCanvasObject(event.localPosition);
        },
        child: GestureDetector(
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
      ),
    );
  }
}
