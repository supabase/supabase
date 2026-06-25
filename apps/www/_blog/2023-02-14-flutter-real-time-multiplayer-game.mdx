---
title: How to build a real-time multiplayer game with Flutter Flame
description: Build a real-time multiplayer game using Flutter, Flame, and Supabase realtime.
author: tyler_shukert
imgSocial: flutter-realtime-game/flutter-flame-realtime-multiplayer-game.jpg
imgThumb: flutter-realtime-game/flutter-flame-realtime-multiplayer-game.jpg
categories:
  - developers
tags:
  - flutter
  - mobile
  - realtime
date: '2023-02-14'
toc_depth: 3
---

Flutter is a UI library to build apps that run on any platform, but it can also build interactive games thanks to an open-source game engine built on top of Flutter called [Flame](https://flame-engine.org/). Flame takes care of things like collision detection or loading image sprites to bring game development to all the Flutter devs. We can take it a step further to introduce real-time communication features so that players can play against each other in real-time.

In this article, we will use Flutter, Flame, and Supabase's real-time features to build a real-time multiplayer shooting game. You can find the complete code of this tutorial [here](https://github.com/supabase/supabase/tree/master/examples/realtime/flutter-multiplayer-shooting-game).

## Overview of the final game

<video width="99%" loop muted playsInline controls={true}>
  <source
    src="https://xguihxuzqibwxjnimxev.supabase.co/storage/v1/object/public/videos/marketing/blog/flutter-realtime-game/playing-realtime-game.mp4"
    type="video/mp4"
  />
</video>

The game is a simple shooting game. Each player has a UFO, and you can move it by dragging your finger across the screen. The UFO will emit bullets automatically in three directions, and the objective of the game is to hit the opponents with bullets before your UFO gets destroyed by the opponent’s bullets. The position and the health points are synced using a low-latency web socket connection provided by Supabase.

Before entering the main game, there is a lobby where you can wait for other players to show up. Once another player shows up, you can hit start, which will kick off the game on both ends.

We will first build the Flutter widgets used to build the basic UI, then build the Flame game and finally handle the network connection to share the data between connected clients.

## Build the App

### Step 1. Create the Flutter App

We will start out by creating the Flutter app. Open your terminal and create a new app named with the following command.

```bash
flutter create flame_realtime_shooting
```

Open the created app with your favorite IDE and let’s get started with coding!

### Step 2. Building the Flutter widgets

We will have a simple directory structure to build this app. Since we only have a few widgets, we will just add them inside `main.dart` file.

```
├── lib/
|   ├── game/
│   │   ├── game.dart
│   │   ├── player.dart
│   │   └── bullet.dart
│   └── main.dart
```

### Create the Main Game Page

We will create minimal Flutter widgets for this app as most of the game logic will be handled in the Flame Game classes later. Our game will have a single page with two dialogs before the game starts and after the game ends. The page will simply contain the [GameWidget](https://docs.flame-engine.org/1.6.0/flame/game_widget.html) while displaying a nice background image. We will make it a StatefulWidget, because we will add methods to handle sending and receiving real-time data later on. Add the following to `main.dart` file.

```dart
import 'package:flame/game.dart';
import 'package:flame_realtime_shooting/game/game.dart';
import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      title: 'UFO Shooting Game',
      debugShowCheckedModeBanner: false,
      home: GamePage(),
    );
  }
}

class GamePage extends StatefulWidget {
  const GamePage({Key? key}) : super(key: key);

  @override
  State<GamePage> createState() => _GamePageState();
}

class _GamePageState extends State<GamePage> {
  late final MyGame _game;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          Image.asset('assets/images/background.jpg', fit: BoxFit.cover),
          GameWidget(game: _game),
        ],
      ),
    );
  }

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async {
    _game = MyGame(
      onGameStateUpdate: (position, health) async {
        // TODO: handle gmae state update here
      },
      onGameOver: (playerWon) async {
        // TODO: handle when the game is over here
      },
    );

    // await for a frame so that the widget mounts
    await Future.delayed(Duration.zero);

    if (mounted) {
      _openLobbyDialog();
    }
  }

  void _openLobbyDialog() {
    showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) {
          return _LobbyDialog(
            onGameStarted: (gameId) async {
              // handle game start here
            },
          );
        });
  }
}
```

You will see some errors, because we are importing some files that we haven’t created yet, but don’t worry, because we will get to it soon.

### Create the Lobby Dialog

![Flutter Flame shooting game lobby dialog](/images/blog/flutter-realtime-game/lobby.png)

Lobby dialog class on the surface is a simple Alert dialog, but will hold its own states like the list of players that are waiting at the lobby. We will also add some classes to handle the presence data on the lobby later on, but for now we will just have a simple AlertDialog. Add the following code at the end of main.dart file.

```dart
class _LobbyDialog extends StatefulWidget {
  const _LobbyDialog({
    required this.onGameStarted,
  });

  final void Function(String gameId) onGameStarted;

  @override
  State<_LobbyDialog> createState() => _LobbyDialogState();
}

class _LobbyDialogState extends State<_LobbyDialog> {
  final List<String> _userids = [];
  bool _loading = false;

  /// TODO: assign unique identifier for the user
  final myUserId = '';

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Lobby'),
      content: _loading
          ? const SizedBox(
              height: 100,
              child: Center(child: CircularProgressIndicator()),
            )
          : Text('${_userids.length} users waiting'),
      actions: [
        TextButton(
          onPressed: _userids.length < 2
              ? null
              : () async {
                  setState(() {
                    _loading = true;
                  });

                  // TODO: notify the other player the start of the game
                },
          child: const Text('start'),
        ),
      ],
    );
  }
}
```

### Step 3. Building the Flame components

### Creating the FlameGame

Now the fun part starts! We will start out by creating our game class. We create a `MyGame` class that extends the [FlameGame](https://docs.flame-engine.org/1.6.0/flame/game.html) class. `FlameGame` takes care of collision detection and pan-detection, and it will also be the parent of all the components that we will add to the game. The game contains 2 components, `Player` and `Bullet`. `MyGame	` is a class that wraps around all components of the game and can control the child components.

![Structure of the shooting game](/images/blog/flutter-realtime-game/game-structure.png)

Let's add flame to our app. Run the following command:

```bash
flutter pub add flame
```

We can then create `MyGame` class. Add the following code in `lib/game.dart` file.

```dart
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
```

There is a lot going here, so let’s break it down. Within the `onLoad` method, we are loading all of the sprites used throughout the game. Then we are adding the player and opponent component.

Within `onPanUpdate`, we handle the user dragging on the screen. Note that we are calling the `onGameStateUpdate` callback to pass the player’s position so that we can share it to the opponent’s client later when we handle network connections. On the other hand, we have the `updateOpponent` method, which is used to update the opponent’s state with the information coming in from the network. We will also add logic to call it from the Flutter widgets later.

Upon starting the game, `_shootBullets()` is called, which shoots out bullets both from the player and the opponent. `_shootBullets()` is a recursive function that calls itself every 500 milliseconds. If the bullet hits the player, it is caught inside the `udpate()` method, which is called on every frame. There we calculate the new player’s health points.

### Creating the Player Component

`Player` component has the UFO sprite and represents the player and the opponent. It extends the `PositionComponent` from Flame. Add the following in `lib/player.dart`

```dart
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
```

You can see that it has a `_isMyPlayer` property, which is true for the player and false for the opponent. If we take a look at the `onLoad` method, we can use this to position it either at the top if it’s the opponent, or at the bottom if it’s the player. We can also see that we are adding a `CircleHitbox`, because we need to detect collisions between it and the bullets. Lastly, we are adding `_Gauge` as its child, which is the health point gauge you see on top of each players. Within `onCollision` callback, we are checking if the collided object is the opponent’s bullet, and if it is, we flag the bullet as `hasBeenHit` and remove it from the game.

`getMirroredPercentPosition` method is used when sharing the position with the opponent’s client. It calculates the mirrored position of the player. `updateHealth` is called when the health changes and updates the bar length of the `_Gauge` class.

### Adding bullets

Lastly we will add the `Bullet` class. It represents a single bullet coming out from the player and the opponent. Within `onLoad` it adds the sprite to apply the nice image and `CircleHitbox` so that it can collide with other objects. You can also see that it receives a `velocity` in the constructor, the position is updated using the velocity and the elapsed time within the `update` method. This is how you can have it move in a single direction at a constant speed.

```dart
import 'dart:async';

import 'package:flame/collisions.dart';
import 'package:flame/components.dart';
import 'package:flame/image_composition.dart' as flame_image;

class Bullet extends PositionComponent with CollisionCallbacks, HasGameRef {
  final Vector2 velocity;

  final flame_image.Image image;

  static const radius = 5.0;

  bool hasBeenHit = false;

  final bool isMine;

  /// Damage that it deals when it hits the player
  final int damage = 5;

  Bullet({
    required this.isMine,
    required this.velocity,
    required this.image,
    required Vector2 initialPosition,
  }) : super(position: initialPosition);

  @override
  Future<void>? onLoad() async {
    anchor = Anchor.center;

    width = radius * 2;
    height = radius * 2;

    add(CircleHitbox()
      ..collisionType = CollisionType.passive
      ..anchor = Anchor.center);

    final sprite =
        SpriteComponent.fromImage(image, size: Vector2.all(radius * 2));

    add(sprite);
    await super.onLoad();
  }

  @override
  void update(double dt) {
    super.update(dt);
    position += velocity * dt;

    if (position.y < 0 || position.y > gameRef.size.y) {
      removeFromParent();
    }
  }
}
```

### Step 4. Add real-time communications between players

At this point, we have a working shooting game except the opponent does not move, because we have not added any ways to communicate between clients. We will use Supabase’s [realtime features](https://supabase.com/docs/guides/realtime) for this, because it gives us an out of the box solution to handle low-latency real-time communication between players. If you do not have a Supabase project created yet, head over to [database.new](https://database.new/) to create one.

Before we get into any coding, let’s install the Supabase SDK into our app. We will also use the [uuid package](https://pub.dev/packages/uuid) to generate random unique ids for the users. Run the following command:

```bash
flutter pub add supabase_flutter uuid
```

Once `pub get` is complete, let’s initialize Supabase. We will override the `main` function to initialize Supabase. You can get your Supabase URL and Anon Key at `Project Setting` > `API`. Copy and paste them into the `Supabase.initialize` call.

```dart
void main() async {
  await Supabase.initialize(
  url: 'YOUR_SUPABASE_URL',
  anonKey: 'YOUR_ANON_KEY',
  realtimeClientOptions: const RealtimeClientOptions(eventsPerSecond: 40),
  );
  runApp(const MyApp());
}

// Extract Supabase client for easy access to Supabase
final supabase = Supabase.instance.client;
```

`RealtimeClientOptions` here is a parameter to override how many events per second each client will send to Supabase. The default is 10, but we want to override to 40 to provide a more in-synced experience.

With this, we are ready to get into adding the real-time features now.

### Handle the Lobby to wait for Other Players to show up

We will start by rewriting the `_Lobby` class the first thing we have to do in the lobby is to wait and detect other online users also at the lobby. We can implement this using the [presence](https://supabase.com/docs/guides/realtime/presence) feature in Supabase.

Add `initState` and inside it initialize a `RealtimeChannel` instance. We can call it `_lobbyChannel`. If we take a look at the `subscribe()` method, we can see that upon successful subscription to the lobby channel, we are tracking our the unique user ID that we create uplon initialization. We are listening to the `sync` event to get notified whenever anyone is “present”. Within the callback, we are extracting the userIds of all the users in the lobby and set it as the state.A game starts when someone taps on the `Start` button. If we take a look at the `onPressed` callback, we see that we are sending a [broadcast](https://supabase.com/docs/guides/realtime/broadcast) event to the lobby channel with two participant ids and a randomly generated game ID. [Broadcast](https://supabase.com/docs/guides/realtime/broadcast) is a feature of Supabase to send and receive lightweight low-latency data between clients, and when the two participants, one of them being the person tapping on the `start` button, is received on both ends, a game starts. We can observe within `initState` inside the callback for `game_start` event that upon receiving a broadcast event, it checks if the player is one of the participants, and if it is, it will call the `onGameStarted` call back and pop the navigator removing the dialog. The game has begun!

```dart
class _LobbyDialogState extends State<_LobbyDialog> {
  List<String> _userids = [];
  bool _loading = false;

  /// Unique identifier for each players to identify eachother in lobby
  final myUserId = const Uuid().v4();

  late final RealtimeChannel _lobbyChannel;

  @override
  void initState() {
    super.initState();

    _lobbyChannel = supabase.channel(
      'lobby',
      opts: const RealtimeChannelConfig(self: true),
    );
    _lobbyChannel
        .onPresenceSync((payload, [ref]) {
          // Update the lobby count
          final presenceStates = _lobbyChannel.presenceState();

          setState(() {
            _userids = presenceStates
                .map((presenceState) => (presenceState.presences.first)
                    .payload['user_id'] as String)
                .toList();
          });
        })
        .onBroadcast(
            event: 'game_start',
            callback: (payload, [_]) {
              // Start the game if someone has started a game with you
              final participantIds = List<String>.from(payload['participants']);
              if (participantIds.contains(myUserId)) {
                final gameId = payload['game_id'] as String;
                widget.onGameStarted(gameId);
                Navigator.of(context).pop();
              }
            })
        .subscribe(
          (status, _) async {
            if (status == RealtimeSubscribeStatus.subscribed) {
              await _lobbyChannel.track({'user_id': myUserId});
            }
          },
        );
  }

  @override
  void dispose() {
    supabase.removeChannel(_lobbyChannel);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Lobby'),
      content: _loading
          ? const SizedBox(
              height: 100,
              child: Center(child: CircularProgressIndicator()),
            )
          : Text('${_userids.length} users waiting'),
      actions: [
        TextButton(
          onPressed: _userids.length < 2
              ? null
              : () async {
                  setState(() {
                    _loading = true;
                  });

                  final opponentId =
                      _userids.firstWhere((userId) => userId != myUserId);
                  final gameId = const Uuid().v4();
                  await _lobbyChannel.sendBroadcastMessage(
                    event: 'game_start',
                    payload: {
                      'participants': [
                        opponentId,
                        myUserId,
                      ],
                      'game_id': gameId,
                    },
                  );
                },
          child: const Text('start'),
        ),
      ],
    );
  }
}
```

### Sharing Game States with the Opposing Player

Once a game begins, we need to synchronize the game states between the two clients. In our case, we will sync only the player’s position and health points. Whenever a player moves, or the player’s health points change, the `onGameStateUpdate` callback on our `MyGame` instance that will fire notifying the update along with its position and health point. We will broadcast those information to the opponent’s client via Supabase [broadcast feature](https://supabase.com/docs/guides/realtime/broadcast).

Fill in the `_initialize` method like the following to initialize the game.

```dart
class GamePage extends StatefulWidget {
  const GamePage({Key? key}) : super(key: key);

  @override
  State<GamePage> createState() => _GamePageState();
}

class _GamePageState extends State<GamePage> {
  late final MyGame _game;

  /// Holds the RealtimeChannel to sync game states
  RealtimeChannel? _gameChannel;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          Image.asset('assets/images/background.jpg', fit: BoxFit.cover),
          GameWidget(game: _game),
        ],
      ),
    );
  }

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async {
    _game = MyGame(
      onGameStateUpdate: (position, health) async {
        ChannelResponse response;
        do {
          response = await _gameChannel!.sendBroadcastMessage(
            event: 'game_state',
            payload: {'x': position.x, 'y': position.y, 'health': health},
          );

          // wait for a frame to avoid infinite rate limiting loops
          await Future.delayed(Duration.zero);
          setState(() {});
        } while (response == ChannelResponse.rateLimited && health <= 0);
      },
      onGameOver: (playerWon) async {
        await showDialog(
          barrierDismissible: false,
          context: context,
          builder: ((context) {
            return AlertDialog(
              title: Text(playerWon ? 'You Won!' : 'You lost...'),
              actions: [
                TextButton(
                  onPressed: () async {
                    Navigator.of(context).pop();
                    await supabase.removeChannel(_gameChannel!);
                    _openLobbyDialog();
                  },
                  child: const Text('Back to Lobby'),
                ),
              ],
            );
          }),
        );
      },
    );

    // await for a frame so that the widget mounts
    await Future.delayed(Duration.zero);

    if (mounted) {
      _openLobbyDialog();
    }
  }

  void _openLobbyDialog() {
    showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) {
          return _LobbyDialog(
            onGameStarted: (gameId) async {
              // await a frame to allow subscribing to a new channel in a realtime callback
              await Future.delayed(Duration.zero);

              setState(() {});

              _game.startNewGame();

              _gameChannel = supabase.channel(gameId,
                  opts: const RealtimeChannelConfig(ack: true));

              _gameChannel!
                  .onBroadcast(
                    event: 'game_state',
                    callback: (payload, [_]) {
                      final position = Vector2(
                          payload['x'] as double, payload['y'] as double);
                      final opponentHealth = payload['health'] as int;
                      _game.updateOpponent(
                        position: position,
                        health: opponentHealth,
                      );

                      if (opponentHealth <= 0) {
                        if (!_game.isGameOver) {
                          _game.isGameOver = true;
                          _game.onGameOver(true);
                        }
                      }
                    },
                  )
                  .subscribe();
            },
          );
        });
  }
}
```

You can see that within `_openLobbyDialog`, there is an `onGameStarted` callback for when the game has started. Once a game has been started, it creates a new channel using the game ID as the channel name and starts listening to game state updates from the opponent.You can see that within the `onGameOver` callback, we are showing a simple dialog. Upon tapping `Back to Lobby`, the user will be taken back to the lobby dialog, where they can start another game if they want to.

![Post game dialog](/images/blog/flutter-realtime-game/post-game-dialog.png)

With all of that put together, we have a functioning real-time multiplayer shooting game. Grab a friend, run the app with `flutter run`, and have fun with it!

## Conclusions

We learned how to create an interactive shooting game. We took advantage of Flutter’s dialogs to create a quick and easy lobby and post-game UI. Then we created the game using Flame. We learned how to detect and handle collisions and experienced how easy creating a sophisticated game was using Flame. Finally, we added capabilities to share game states with other clients to complete a real-time multiplayer experience without managing our own infrastructure using [Supabase](https://supabase.com/).

## More Flutter Resources

- [Complete code of this article](https://github.com/supabase/supabase/tree/master/examples/realtime/flutter-multiplayer-shooting-game)
- [Flutter Tutorial: building a Flutter chat app](https://supabase.com/blog/flutter-tutorial-building-a-chat-app)
- [Flutter Authentication and Authorization with RLS](https://supabase.com/blog/flutter-authentication-and-authorization-with-rls)
- [Generate Flame template using Very Good CLI](https://verygood.ventures/blog/generate-a-game-with-our-new-template)
- [Supabase Flutter SDK docs](https://supabase.com/docs/reference/dart/start)
