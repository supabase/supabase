'use client'

import { useState } from 'react'
import ExampleLayout from '../example-layout'

export default function SimpleCarExample() {
  const [instanceId] = useState(() => Math.random().toString(36).substring(2, 9))

  const appJsCode = `import { useEffect, useState, useRef } from 'react';
import './styles.css';
import { createClient } from '@supabase/supabase-js';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics, useBox, usePlane } from '@react-three/cannon';
import { OrbitControls, Text } from '@react-three/drei';
import { MathUtils } from 'three';

// Initialize Supabase client
const supabaseUrl = '${process.env.NEXT_PUBLIC_SUPABASE_REALTIME_URL}';
const supabaseKey = '${process.env.NEXT_PUBLIC_SUPABASE_REALTIME_ANON_KEY}';
const supabase = createClient(supabaseUrl, supabaseKey);

// Channel name - using a unique ID to ensure both instances connect to the same channel
const CHANNEL = 'car-simple-example-${instanceId}';

// Game constants
const CAR_SIZE = [1, 0.5, 2]; // Width, height, length
const CAR_ACCELERATION = 0.05;
const CAR_MAX_SPEED = 0.3;
const CAR_ROTATION_SPEED = 0.05;
const BROADCAST_THROTTLE = 50; // ms between broadcasts

// Car colors
const COLORS = [
  '#ff3366', // Pink
  '#33ccff', // Blue
];

// Starting positions
const START_POSITIONS = [
  [-15, 0.5, -15], // Bottom left corner
  [15, 0.5, 15],   // Top right corner
  [-15, 0.5, 15],  // Top left corner
  [15, 0.5, -15],  // Bottom right corner
];

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [players, setPlayers] = useState([]);
  const [localPlayer, setLocalPlayer] = useState(null);
  
  const userId = useRef(Math.random().toString(36).substring(2, 15));
  const channelRef = useRef(null);
  const keysPressed = useRef({});
  const localPlayerRef = useRef(null);

  // Keep the ref in sync with the state
  useEffect(() => {
    localPlayerRef.current = localPlayer;
  }, [localPlayer]);

  // Initialize game
  useEffect(() => {
    console.log('Initializing game...');
    
    // Generate a username
    const username = \`Player\${Math.floor(Math.random() * 1000)}\`;
    
    // Determine player index (0 or 1) based on connection order
    const playerIndex = players.length;
    
    // Assign color and position based on player index
    const playerColor = COLORS[playerIndex % COLORS.length];
    const startPos = START_POSITIONS[playerIndex % START_POSITIONS.length];
    
    // Create initial player state
    const initialPlayerState = {
      id: userId.current,
      username: username,
      position: [...startPos],
      rotation: [0, 0, 0],
      color: playerColor,
      speed: 0,
      lastUpdated: Date.now()
    };
    
    setLocalPlayer(initialPlayerState);
    localPlayerRef.current = initialPlayerState;
    
    // Set up Supabase channel
    const channel = supabase.channel(CHANNEL, {
      config: {
        presence: {
          key: userId.current,
        },
      },
    });
    
    channelRef.current = channel;
    
    // Handle presence for player list
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const presenceList = [];
      
      // Convert presence state to array
      Object.keys(state).forEach(key => {
        const presences = state[key];
        presenceList.push(...presences);
      });
      
      // Update players list, but keep local player's state
      setPlayers(prevPlayers => {
        const updatedPlayers = presenceList.map(presence => {
          // If this is our local player, use our local state
          if (presence.id === userId.current) {
            return localPlayerRef.current || presence;
          }
          
          // For other players, find their previous state or use presence data
          const existingPlayer = prevPlayers.find(p => p.id === presence.id);
          
          if (existingPlayer) {
            // If player already exists, keep their interpolation data
            return {
              ...existingPlayer,
              // Update any new properties from presence
              ...presence,
              // But keep position, rotation for smooth transitions
              position: existingPlayer.position,
              rotation: existingPlayer.rotation,
              currentPosition: existingPlayer.currentPosition,
              targetPosition: existingPlayer.targetPosition,
              currentRotation: existingPlayer.currentRotation,
              targetRotation: existingPlayer.targetRotation,
              interpolating: existingPlayer.interpolating
            };
          } else {
            // For new players, initialize interpolation data
            return {
              ...presence,
              // Add interpolation properties
              currentPosition: [...presence.position],
              targetPosition: [...presence.position],
              currentRotation: [...(presence.rotation || [0, 0, 0])],
              targetRotation: [...(presence.rotation || [0, 0, 0])],
              interpolating: false
            };
          }
        });
        
        return updatedPlayers;
      });
    });
    
    // Handle player position updates
    channel.on('broadcast', { event: 'player_update' }, (payload) => {
      const updatedPlayer = payload.payload;
      
      // Don't update our own player (we manage that locally)
      if (updatedPlayer.id === userId.current) return;
      
      // Update the player in our list
      setPlayers(prevPlayers => {
        return prevPlayers.map(player => {
          if (player.id === updatedPlayer.id) {
            return {
              ...player,
              // Set interpolation targets
              targetPosition: [...updatedPlayer.position],
              targetRotation: [...updatedPlayer.rotation],
              // Keep current positions for interpolation
              position: player.position,
              rotation: player.rotation,
              // Mark as interpolating
              interpolating: true,
              // Update timestamp
              lastUpdated: updatedPlayer.lastUpdated
            };
          }
          return player;
        });
      });
    });
    
    // Subscribe to channel
    channel.subscribe(async (status) => {
      console.log('Channel subscription status:', status);
      if (status === 'SUBSCRIBED') {
        // Track presence
        await channel.track(initialPlayerState);
        setIsConnected(true);
        console.log('Connected to channel, isConnected set to true');
      }
    });
    
    // Set up keyboard event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, []);

  // Broadcast player position when it changes
  useEffect(() => {
    if (!localPlayer || !channelRef.current || !isConnected) return;
    
    // Broadcast our updated position
    channelRef.current.send({
      type: 'broadcast',
      event: 'player_update',
      payload: localPlayer
    });
    
    // Update our presence data
    channelRef.current.track(localPlayer);
    
  }, [localPlayer, isConnected]);

  // Handle key down events
  const handleKeyDown = (e) => {
    // Prevent default behavior for game control keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
      e.preventDefault();
    }
    
    keysPressed.current[e.code] = true;
  };

  // Handle key up events
  const handleKeyUp = (e) => {
    // Prevent default behavior for game control keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
      e.preventDefault();
    }
    
    keysPressed.current[e.code] = false;
  };

  return (
    <div className="app-container">
      {/* Toolbar */}
      <div className="toolbar dark-theme">
        <h1>Simple Car Controls</h1>
        <div className="game-controls">
          <div className="controls-info">
            <span>Controls: Arrow Keys / WASD to drive</span>
          </div>
          <div className="user-presence">
            {players.map((player) => (
              <div 
                key={player.id} 
                className="user-badge" 
                style={{ backgroundColor: player.color }}
              >
                <span>{player.username}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="main-content" tabIndex="0">
        <Canvas shadows camera={{ position: [0, 20, 0], fov: 50 }}>
          <color attach="background" args={['#222222']} />
          
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight 
            position={[10, 10, 10]} 
            intensity={0.8} 
            castShadow 
          />
          
          <Physics gravity={[0, -9.8, 0]}>
            {/* Ground */}
            <Ground />
            
            {/* Cars */}
            {players.map((player) => (
              <Car 
                key={player.id} 
                player={player} 
                isLocal={player.id === userId.current}
                keysPressed={keysPressed.current}
                setLocalPlayer={setLocalPlayer}
              />
            ))}
          </Physics>
          
          {/* Interpolation manager - handles smooth transitions for remote players */}
          <InterpolationManager 
            players={players} 
            setPlayers={setPlayers} 
            localPlayerId={userId.current} 
          />
          
          <OrbitControls 
            enableZoom={true} 
            enablePan={false}
            maxPolarAngle={Math.PI / 2.1}
          />
        </Canvas>
        
        {/* Debug Button */}
        <button 
          className="debug-button" 
          onClick={() => {
            console.log("Debug - Current state:", {
              players,
              localPlayer,
              keysPressed: keysPressed.current
            });
          }}
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            zIndex: 1000,
            background: '#333',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '4px'
          }}
        >
          Debug
        </button>
        
        {/* Debug display */}
        <div 
          style={{
            position: 'fixed',
            top: '10px',
            left: '10px',
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '14px',
            zIndex: 1000,
            fontFamily: 'monospace'
          }}
        >
          <div>Connected: {isConnected ? 'true' : 'false'}</div>
          <div>Players: {players.length}</div>
        </div>
      </div>
    </div>
  );
}

// Interpolation manager component - must be inside Canvas
function InterpolationManager({ players, setPlayers, localPlayerId }) {
  // Run on every frame
  useFrame((state, delta) => {
    // Skip if no players
    if (players.length === 0) return;
    
    // Update players with interpolation
    setPlayers(prevPlayers => {
      // Check if any players need interpolation
      let needsUpdate = false;
      
      const updatedPlayers = prevPlayers.map(player => {
        // Skip local player
        if (player.id === localPlayerId) return player;
        
        // Skip if not interpolating
        if (!player.interpolating) return player;
        
        // Calculate interpolation step - faster is smoother
        const lerpAmount = Math.min(10 * delta, 1);
        
        // Create new interpolated position
        const newPosition = [
          MathUtils.lerp(player.currentPosition[0], player.targetPosition[0], lerpAmount),
          MathUtils.lerp(player.currentPosition[1], player.targetPosition[1], lerpAmount),
          MathUtils.lerp(player.currentPosition[2], player.targetPosition[2], lerpAmount)
        ];
        
        // Create new interpolated rotation
        const newRotation = [
          MathUtils.lerp(player.currentRotation[0], player.targetRotation[0], lerpAmount),
          MathUtils.lerp(player.currentRotation[1], player.targetRotation[1], lerpAmount),
          MathUtils.lerp(player.currentRotation[2], player.targetRotation[2], lerpAmount)
        ];
        
        // Check if we've reached the target
        const reachedTarget = 
          Math.abs(newPosition[0] - player.targetPosition[0]) < 0.01 &&
          Math.abs(newPosition[1] - player.targetPosition[1]) < 0.01 &&
          Math.abs(newPosition[2] - player.targetPosition[2]) < 0.01;
        
        if (reachedTarget) {
          // We've reached the target, stop interpolating
          return {
            ...player,
            position: [...player.targetPosition],
            rotation: [...player.targetRotation],
            currentPosition: [...player.targetPosition],
            currentRotation: [...player.targetRotation],
            interpolating: false
          };
        } else {
          // Still interpolating
          needsUpdate = true;
          return {
            ...player,
            position: newPosition,
            rotation: newRotation,
            currentPosition: newPosition,
            currentRotation: newRotation
          };
        }
      });
      
      // Only update state if something changed
      return needsUpdate ? updatedPlayers : prevPlayers;
    });
  });

  // This component doesn't render anything
  return null;
}

// Ground component
function Ground() {
  const [ref] = usePlane(() => ({ 
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    type: 'Static'
  }));

  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#444444" />
      
      {/* Grid lines for visual reference */}
      {Array.from({ length: 21 }).map((_, i) => {
        const pos = i * 5 - 50/2;
        return (
          <group key={i}>
            <mesh position={[pos, 0.01, 0]} rotation={[-Math.PI/2, 0, 0]}>
              <planeGeometry args={[0.05, 50]} />
              <meshBasicMaterial color="#666666" />
            </mesh>
            <mesh position={[0, 0.01, pos]} rotation={[-Math.PI/2, 0, 0]}>
              <planeGeometry args={[50, 0.05]} />
              <meshBasicMaterial color="#666666" />
            </mesh>
          </group>
        );
      })}
    </mesh>
  );
}

// Car component
function Car({ player, isLocal, keysPressed, setLocalPlayer }) {
  const [ref, api] = useBox(() => ({ 
  mass: isLocal ? 1 : 0, // No mass for remote cars
  position: player?.position || [0, 0.5, 0],
  rotation: player?.rotation || [0, 0, 0],
  args: CAR_SIZE,
  allowSleep: false,
  linearDamping: 0.9,
  angularDamping: 0.9,
  type: isLocal ? 'Dynamic' : 'Kinematic', // Kinematic for remote cars
  collisionFilterGroup: isLocal ? 1 : 2, // Different collision groups
  collisionFilterMask: isLocal ? 1 : 0   // Local cars collide with other local cars, remote don't collide
}));

  const positionRef = useRef(player?.position || [0, 0.5, 0]);
  const rotationRef = useRef(player?.rotation || [0, 0, 0]);
  const velocityRef = useRef([0, 0, 0]);
  const speedRef = useRef(0);
  const lastBroadcastRef = useRef(Date.now());
  const lastPositionRef = useRef(player?.position || [0, 0.5, 0]);

  // For remote cars, directly update position from props
  useEffect(() => {
    if (!isLocal && player) {
      api.position.set(...player.position);
      api.rotation.set(...player.rotation);
    }
  }, [player?.position, player?.rotation, isLocal, api]);

  // Subscribe to position and rotation changes
  useEffect(() => {
    if (!player) return;

    const unsubPosition = api.position.subscribe((p) => {
      positionRef.current = p;
    });

    const unsubRotation = api.rotation.subscribe((r) => {
      rotationRef.current = r;
    });

    const unsubVelocity = api.velocity.subscribe((v) => {
      velocityRef.current = v;
      const speed = Math.sqrt(v[0] * v[0] + v[2] * v[2]);
      speedRef.current = speed;
    });

    return () => {
      unsubPosition();
      unsubRotation();
      unsubVelocity();
    };
  }, [api, player]);

  // Handle controls for local car
  useFrame(() => {
    if (!player || !isLocal) return;
    
    // Get current position and rotation
    const position = positionRef.current;
    const rotation = rotationRef.current;
    
    // Calculate forward direction based on car's rotation
    const forwardX = Math.sin(rotation[1]);
    const forwardZ = Math.cos(rotation[1]);
    
    // Current speed
    let speed = speedRef.current;
    
    // Handle acceleration/braking
    if (keysPressed['ArrowUp'] || keysPressed['KeyW']) {
      // Accelerate
      speed += CAR_ACCELERATION;
      if (speed > CAR_MAX_SPEED) speed = CAR_MAX_SPEED;
    } else if (keysPressed['ArrowDown'] || keysPressed['KeyS']) {
      // Brake/reverse
      speed -= CAR_ACCELERATION;
      if (speed < -CAR_MAX_SPEED/2) speed = -CAR_MAX_SPEED/2;
    } else {
      // Slow down naturally
      speed *= 0.98;
    }
    
    // Handle steering
    let angularVelocity = 0;
    if (keysPressed['ArrowLeft'] || keysPressed['KeyA']) {
      // Turn left
      angularVelocity = CAR_ROTATION_SPEED * Math.min(1, speed * 5);
    } else if (keysPressed['ArrowRight'] || keysPressed['KeyD']) {
      // Turn right
      angularVelocity = -CAR_ROTATION_SPEED * Math.min(1, speed * 5);
    }
    
    // Apply angular velocity (only when moving)
    if (Math.abs(speed) > 0.01 && angularVelocity !== 0) {
      api.angularVelocity.set(0, angularVelocity, 0);
    }
    
    // Apply linear velocity in the direction the car is facing
    api.velocity.set(forwardX * speed, 0, forwardZ * speed);
    
    // Broadcast position updates
    const now = Date.now();
    if (now - lastBroadcastRef.current > BROADCAST_THROTTLE) {
      lastBroadcastRef.current = now;
      
      // Calculate distance moved since last update
      const dx = Math.abs(position[0] - lastPositionRef.current[0]);
      const dz = Math.abs(position[2] - lastPositionRef.current[2]);
      const moved = Math.sqrt(dx*dx + dz*dz);
      
      // Only update if the car has moved enough
      if (moved > 0.05 || Math.abs(rotation[1] - lastPositionRef.current[3]) > 0.05) {
        lastPositionRef.current = [...position, rotation[1]]; // Store rotation in 4th element
        
        setLocalPlayer(prev => {
          if (!prev) return prev;
          
          return {
            ...prev,
            position: [...position],
            rotation: [...rotation],
            speed: speed,
            lastUpdated: now
          };
        });
      }
    }
  });

  // Car color
  const carColor = player.color || '#ff3366';

  return (
    <group ref={ref}>
      {/* Car body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={CAR_SIZE} />
        <meshStandardMaterial 
          color={carColor} 
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>
      
      {/* Car roof (to distinguish front/back) */}
      <mesh position={[0, 0.3, -0.3]} castShadow>
        <boxGeometry args={[0.8, 0.2, 0.8]} />
        <meshStandardMaterial 
          color={carColor} 
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
      
      {/* Player name */}
      <Text
        position={[0, 1.2, 0]}
        fontSize={0.4}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        rotation={[0, Math.PI, 0]}
      >
        {player.username || "Unknown"}
      </Text>
    </group>
  );
}
`

  const simpleCarFiles = {
    '/App.js': appJsCode,
    '/styles.css': `.app-container {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #111111;
  color: #ffffff;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #222222;
  border-bottom: 1px solid #333333;
}

.dark-theme {
  background-color: #222222;
  color: #ffffff;
}

h1 {
  margin: 0;
  font-size: 24px;
}

.game-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

.controls-info {
  font-size: 14px;
  color: #dddddd;
}

.user-presence {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.user-badge {
  display: flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 14px;
  color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.main-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  outline: none; /* Hide outline by default */
}

/* Only show outline when tabbing for accessibility */
.main-content:focus-visible {
  outline: 2px solid #ff3366;
}

canvas {
  width: 100%;
  height: 100%;
}

.debug-button {
  position: absolute;
  bottom: 10px;
  right: 10px;
  padding: 5px 10px;
  font-size: 14px;
  color: white;
  background-color: #333;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.debug-button:hover {
  background-color: #444;
}
`,
  }

  return (
    <ExampleLayout
      appJsCode={appJsCode}
      files={simpleCarFiles}
      dependencies={{
        '@react-three/fiber': 'latest',
        '@react-three/cannon': 'latest',
        '@react-three/drei': 'latest',
        three: 'latest',
      }}
      title="Simple Car Controls"
      description="A multiplayer 3D car racing game where players can drive vehicles around a physics-based environment. This example demonstrates real-time position synchronization, physics simulation with collision detection, and player presence. Built with Three.js and React Three Fiber, it showcases how to create immersive multiplayer experiences with smooth movement interpolation, throttled network updates, and responsive controls. Perfect for learning game development concepts with Supabase Realtime."
    />
  )
}
