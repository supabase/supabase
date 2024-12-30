import 'dart:async';

import 'package:flame/collisions.dart';
import 'package:flame/components.dart';
import 'package:flame_realtime_shooting/game/bullet.dart';
import 'package:flutter/material.dart';

class Player extends PositionComponent with HasGameRef, CollisionCallbacks {
  Vector2 velocity = Vector2.zero();

  late final Vector2 initialPosition;

  Player({required bool isMe}) : _isMyPlayer = isMe;

  /// Whether it's me or the opponent
  final bool _isMyPlayer;

  static const radius = 30.0;

  @override
  Future<void>? onLoad() async {
    anchor = Anchor.center;
    width = radius * 2;
    height = radius * 2;

    final initialX = gameRef.size.x / 2;
    initialPosition = _isMyPlayer
        ? Vector2(initialX, gameRef.size.y * 0.8)
        : Vector2(initialX, gameRef.size.y * 0.2);
    position = initialPosition;

    add(CircleHitbox());
    add(_Gauge());
    await super.onLoad();
  }

  void move(Vector2 delta) {
    position += delta;
  }

  void updateHealth(double healthLeft) {
    for (final child in children) {
      if (child is _Gauge) {
        child._healthLeft = healthLeft;
      }
    }
  }

  @override
  void onCollision(Set<Vector2> intersectionPoints, PositionComponent other) {
    super.onCollision(intersectionPoints, other);
    if (other is Bullet && _isMyPlayer != other.isMine) {
      other.hasBeenHit = true;
      other.removeFromParent();
    }
  }

  /// returns the mirrored percent position of the player
  /// to be broadcasted to other clients
  Vector2 getMirroredPercentPosition() {
    final mirroredPosition = gameRef.size - position;
    return Vector2(mirroredPosition.x / gameRef.size.x,
        mirroredPosition.y / gameRef.size.y);
  }
}

class _Gauge extends PositionComponent {
  double _healthLeft = 1.0;

  @override
  FutureOr<void> onLoad() {
    final playerParent = parent;
    if (playerParent is Player) {
      width = playerParent.width;
      height = 10;
      anchor = Anchor.centerLeft;
      position = Vector2(0, 0);
    }
    return super.onLoad();
  }

  @override
  void render(Canvas canvas) {
    super.render(canvas);
    canvas.drawRect(
        Rect.fromPoints(
          const Offset(0, 0),
          Offset(width, height),
        ),
        Paint()..color = Colors.white);
    canvas.drawRect(
        Rect.fromPoints(
          const Offset(0, 0),
          Offset(width * _healthLeft, height),
        ),
        Paint()
          ..color = _healthLeft > 0.5
              ? Colors.green
              : _healthLeft > 0.25
                  ? Colors.orange
                  : Colors.red);
  }
}
