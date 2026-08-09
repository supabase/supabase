import 'dart:async';

import 'package:flame/game.dart';
import 'package:flame/components.dart';
import 'package:flame/events.dart';
import 'package:flame/image_composition.dart' as flame_image;
import 'package:flame_realtime_shooting/game/bullet.dart';
import 'package:flame_realtime_shooting/game/player.dart';
import 'package:flutter/material.dart';

class MyGame extends FlameGame with PanDetector, HasCollisionDetection {
  MyGame({
    required this.onGameOver,
    required this.onGameStateUpdate,
  });

  static const _initialHealthPoints = 100;

  /// Callback to notify the parent when the game ends.
  final void Function(bool didWin) onGameOver;

  /// Callback for when the game state updates.
  final void Function(
    Vector2 position,
    int health,
  ) onGameStateUpdate;

  /// `Player` instance of the player
  late Player _player;

  /// `Player` instance of the opponent
  late Player _opponent;

  bool isGameOver = true;

  int _playerHealthPoint = _initialHealthPoints;

  late final flame_image.Image _playerBulletImage;
  late final flame_image.Image _opponentBulletImage;

  @override
  Color backgroundColor() {
    return Colors.transparent;
  }

  @override
  Future<void>? onLoad() async {
    final playerImage = await images.load('player.png');
    _player = Player(isMe: true);
    final spriteSize = Vector2.all(Player.radius * 2);
    _player.add(SpriteComponent(sprite: Sprite(playerImage), size: spriteSize));
    add(_player);

    final opponentImage = await images.load('opponent.png');
    _opponent = Player(isMe: false);
    _opponent.add(SpriteComponent.fromImage(opponentImage, size: spriteSize));
    add(_opponent);

    _playerBulletImage = await images.load('player-bullet.png');
    _opponentBulletImage = await images.load('opponent-bullet.png');

    await super.onLoad();
  }

  @override
  void onPanUpdate(DragUpdateInfo info) {
    _player.move(info.delta.global);
    final mirroredPosition = _player.getMirroredPercentPosition();
    onGameStateUpdate(mirroredPosition, _playerHealthPoint);
    super.onPanUpdate(info);
  }

  @override
  void update(double dt) {
    super.update(dt);
    if (isGameOver) {
      return;
    }
    for (final child in children) {
      if (child is Bullet && child.hasBeenHit && !child.isMine) {
        _playerHealthPoint = _playerHealthPoint - child.damage;
        final mirroredPosition = _player.getMirroredPercentPosition();
        onGameStateUpdate(mirroredPosition, _playerHealthPoint);
        _player.updateHealth(_playerHealthPoint / _initialHealthPoints);
      }
    }
    if (_playerHealthPoint <= 0) {
      endGame(false);
    }
  }

  void startNewGame() {
    isGameOver = false;
    _playerHealthPoint = _initialHealthPoints;

    for (final child in children) {
      if (child is Player) {
        child.position = child.initialPosition;
      } else if (child is Bullet) {
        child.removeFromParent();
      }
    }

    _shootBullets();
  }

  /// shoots out bullets form both the player and the opponent.
  ///
  /// Calls itself every 500 milliseconds
  Future<void> _shootBullets() async {
    await Future.delayed(const Duration(milliseconds: 500));

    /// Player's bullet
    final playerBulletInitialPosition = Vector2.copy(_player.position)
      ..y -= Player.radius;
    final playerBulletVelocities = [
      Vector2(0, -100),
      Vector2(60, -80),
      Vector2(-60, -80),
    ];
    for (final bulletVelocity in playerBulletVelocities) {
      add((Bullet(
        isMine: true,
        velocity: bulletVelocity,
        image: _playerBulletImage,
        initialPosition: playerBulletInitialPosition,
      )));
    }

    /// Opponent's bullet
    final opponentBulletInitialPosition = Vector2.copy(_opponent.position)
      ..y += Player.radius;
    final opponentBulletVelocities = [
      Vector2(0, 100),
      Vector2(60, 80),
      Vector2(-60, 80),
    ];
    for (final bulletVelocity in opponentBulletVelocities) {
      add((Bullet(
        isMine: false,
        velocity: bulletVelocity,
        image: _opponentBulletImage,
        initialPosition: opponentBulletInitialPosition,
      )));
    }

    _shootBullets();
  }

  void updateOpponent({required Vector2 position, required int health}) {
    _opponent.position = Vector2(size.x * position.x, size.y * position.y);
    _opponent.updateHealth(health / _initialHealthPoints);
  }

  /// Called when either the player or the opponent has run out of health points
  void endGame(bool playerWon) {
    isGameOver = true;
    onGameOver(playerWon);
  }
}
