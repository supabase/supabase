import 'dart:convert';
import 'dart:math';
import 'dart:ui';

import 'package:uuid/uuid.dart';

/// Handy extension method to create random colors
extension RandomColor on Color {
  static Color getRandom() {
    return Color((Random().nextDouble() * 0xFFFFFF).toInt()).withOpacity(1.0);
  }

  /// Quick and dirty method to create a random color from the userID
  static Color getRandomFromId(String id) {
    final seed = utf8.encode(id).reduce((value, element) => value + element);
    return Color((Random(seed).nextDouble() * 0xFFFFFF).toInt())
        .withOpacity(1.0);
  }
}

/// Objects that are being synced in realtime over broadcast
///
/// Includes mouse cursor and design objects
abstract class SyncedObject {
  /// UUID unique identifier of the object
  final String id;

  factory SyncedObject.fromJson(Map<String, dynamic> json) {
    final objectType = json['object_type'];
    if (objectType == UserCursor.type) {
      return UserCursor.fromJson(json);
    } else {
      return CanvasObject.fromJson(json);
    }
  }

  SyncedObject({
    required this.id,
  });

  Map<String, dynamic> toJson();
}

/// Data model for the cursors displayed on the canvas.
class UserCursor extends SyncedObject {
  static String type = 'cursor';

  final Offset position;
  final Color color;

  UserCursor({
    required super.id,
    required this.position,
  }) : color = RandomColor.getRandomFromId(id);

  UserCursor.fromJson(Map<String, dynamic> json)
      : position = Offset(json['position']['x'], json['position']['y']),
        color = RandomColor.getRandomFromId(json['id']),
        super(id: json['id']);

  @override
  Map<String, dynamic> toJson() {
    return {
      'object_type': type,
      'id': id,
      'position': {
        'x': position.dx,
        'y': position.dy,
      }
    };
  }
}

/// Base model for any design objects displayed on the canvas.
abstract class CanvasObject extends SyncedObject {
  final Color color;

  CanvasObject({
    required super.id,
    required this.color,
  });

  factory CanvasObject.fromJson(Map<String, dynamic> json) {
    if (json['object_type'] == Circle.type) {
      return Circle.fromJson(json);
    } else if (json['object_type'] == Rectangle.type) {
      return Rectangle.fromJson(json);
    } else {
      throw UnimplementedError('Unknown object_type: ${json['object_type']}');
    }
  }

  /// Whether or not the object intersects with the given point.
  bool intersectsWith(Offset point);

  CanvasObject copyWith();

  /// Moves the object to a new position
  CanvasObject move(Offset delta);
}

/// Circle displayed on the canvas.
class Circle extends CanvasObject {
  static String type = 'circle';

  final Offset center;
  final double radius;

  Circle({
    required super.id,
    required super.color,
    required this.radius,
    required this.center,
  });

  Circle.fromJson(Map<String, dynamic> json)
      : radius = json['radius'],
        center = Offset(json['center']['x'], json['center']['y']),
        super(id: json['id'], color: Color(json['color']));

  /// Constructor to be used when first starting to draw the object on the canvas
  Circle.createNew(this.center)
      : radius = 0,
        super(id: const Uuid().v4(), color: RandomColor.getRandom());

  @override
  Map<String, dynamic> toJson() {
    return {
      'object_type': type,
      'id': id,
      'color': color.value,
      'center': {
        'x': center.dx,
        'y': center.dy,
      },
      'radius': radius,
    };
  }

  @override
  Circle copyWith({
    double? radius,
    Offset? center,
    Color? color,
  }) {
    return Circle(
      radius: radius ?? this.radius,
      center: center ?? this.center,
      id: id,
      color: color ?? this.color,
    );
  }

  @override
  bool intersectsWith(Offset point) {
    final centerToPointerDistance = (point - center).distance;
    return radius > centerToPointerDistance;
  }

  @override
  Circle move(Offset delta) {
    return copyWith(center: center + delta);
  }
}

/// Rectangle displayed on the canvas.
class Rectangle extends CanvasObject {
  static String type = 'rectangle';

  final Offset topLeft;
  final Offset bottomRight;

  Rectangle({
    required super.id,
    required super.color,
    required this.topLeft,
    required this.bottomRight,
  });

  Rectangle.fromJson(Map<String, dynamic> json)
      : bottomRight =
            Offset(json['bottom_right']['x'], json['bottom_right']['y']),
        topLeft = Offset(json['top_left']['x'], json['top_left']['y']),
        super(id: json['id'], color: Color(json['color']));

  /// Constructor to be used when first starting to draw the object on the canvas
  Rectangle.createNew(Offset startingPoint)
      : topLeft = startingPoint,
        bottomRight = startingPoint,
        super(color: RandomColor.getRandom(), id: const Uuid().v4());

  @override
  Map<String, dynamic> toJson() {
    return {
      'object_type': type,
      'id': id,
      'color': color.value,
      'top_left': {
        'x': topLeft.dx,
        'y': topLeft.dy,
      },
      'bottom_right': {
        'x': bottomRight.dx,
        'y': bottomRight.dy,
      },
    };
  }

  @override
  Rectangle copyWith({
    Offset? topLeft,
    Offset? bottomRight,
    Color? color,
  }) {
    return Rectangle(
      topLeft: topLeft ?? this.topLeft,
      id: id,
      bottomRight: bottomRight ?? this.bottomRight,
      color: color ?? this.color,
    );
  }

  @override
  bool intersectsWith(Offset point) {
    final minX = min(topLeft.dx, bottomRight.dx);
    final maxX = max(topLeft.dx, bottomRight.dx);
    final minY = min(topLeft.dy, bottomRight.dy);
    final maxY = max(topLeft.dy, bottomRight.dy);
    return minX < point.dx &&
        point.dx < maxX &&
        minY < point.dy &&
        point.dy < maxY;
  }

  @override
  Rectangle move(Offset delta) {
    return copyWith(
      topLeft: topLeft + delta,
      bottomRight: bottomRight + delta,
    );
  }
}
