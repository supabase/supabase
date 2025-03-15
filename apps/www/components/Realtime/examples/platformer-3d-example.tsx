'use client'

import { useState } from 'react'
import ExampleLayout from '../example-layout'

export default function Platformer3DExample() {
  const [instanceId] = useState(() => Math.random().toString(36).substring(2, 9))

  const appJsCode = `import { useEffect, useState, useRef } from 'react';
import './styles.css';
import { createClient } from '@supabase/supabase-js';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics, useBox, usePlane } from '@react-three/cannon';
import { OrbitControls, Text } from '@react-three/drei';
import { Vector3, MathUtils } from 'three';

// Initialize Supabase client
const supabaseUrl = '${process.env.NEXT_PUBLIC_SUPABASE_REALTIME_URL}';
const supabaseKey = '${process.env.NEXT_PUBLIC_SUPABASE_REALTIME_ANON_KEY}';
const supabase = createClient(supabaseUrl, supabaseKey);

// Channel name - using a unique ID to ensure both instances connect to the same channel
const CHANNEL = 'platformer-3d-example-${instanceId}';

// Game constants
const MOVE_SPEED = 5;
const JUMP_FORCE = 7;
const PLAYER_SIZE = [1, 1, 1]; // Width, height, depth
const GRAVITY = -9.8;
const BROADCAST_THROTTLE = 50; // ms between broadcasts (20 updates per second)
const INTERPOLATION_SPEED = 15; // Higher values = faster interpolation
const PROJECTILE_SPEED = 15; // Speed of projectiles
const PROJECTILE_SIZE = 0.2; // Size of projectiles
const SHOOT_COOLDOWN = 500; // Cooldown between shots in ms

// Character colors - vibrant neon colors
const COLORS = [
  '#ff00ff', // Neon pink
  '#00ffff', // Neon cyan
  '#ffff00', // Neon yellow
  '#00ff00', // Neon green
  '#ff9900', // Neon orange
  '#ff0099'  // Neon magenta
];

// Spawn positions - safe places to teleport to
const SPAWN_POSITIONS = [
  [0, 1, 0],      // Above ground
  [-3, 2, 0],     // Above left platform
  [3, 3, 0],      // Above right platform
  [0, 4, 0]       // Above center platform
];

export default function App() {
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [players, setPlayers] = useState([]);
  const [localPlayer, setLocalPlayer] = useState(null);
  const [projectiles, setProjectiles] = useState([]);
  const [gameOverMessage, setGameOverMessage] = useState('');
  
  const userId = useRef(Math.random().toString(36).substring(2, 15));
  const channelRef = useRef(null);
  const keysPressed = useRef({});
  const lastShootTime = useRef(0);
  const canShoot = useRef(true);
  const isGameOver = useRef(false);
  
  // Use a ref to track the current localPlayer state to avoid closure issues
  const localPlayerRef = useRef(null);
  
  // Keep the ref in sync with the state
  useEffect(() => {
    localPlayerRef.current = localPlayer;
  }, [localPlayer]);
  
  // Initialize game
  useEffect(() => {
    // Generate a random username
    const adjectives = ['Happy', 'Clever', 'Brave', 'Bright', 'Kind'];
    const nouns = ['Panda', 'Tiger', 'Eagle', 'Dolphin', 'Fox'];
    const randomName = \`\${adjectives[Math.floor(Math.random() * adjectives.length)]}\${
      nouns[Math.floor(Math.random() * nouns.length)]
    }\${Math.floor(Math.random() * 100)}\`;
    setUsername(randomName);
    
    // Assign a random color
    const playerColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    // Create initial player state
    const initialPlayerState = {
      id: userId.current,
      username: randomName,
      position: [Math.random() * 8 - 4, 5, 0], // Higher Y position (5 instead of 3)
      color: playerColor,
      lastUpdated: Date.now(),
      isAlive: true,
      direction: [1, 0, 0] // Default direction (facing right)
    };
    
    setLocalPlayer(initialPlayerState);
    localPlayerRef.current = initialPlayerState; // Also set the ref directly
    
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
              // But keep position and interpolation data
              position: existingPlayer.position,
              currentPosition: existingPlayer.currentPosition,
              targetPosition: existingPlayer.targetPosition,
              interpolating: existingPlayer.interpolating
            };
          } else {
            // For new players, initialize interpolation data
            return {
              ...presence,
              // Add interpolation properties
              currentPosition: [...presence.position],
              targetPosition: [...presence.position],
              interpolating: false,
              isAlive: presence.isAlive !== false, // Default to alive if not specified
              direction: presence.direction || [1, 0, 0] // Default direction
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
            // Only update if the incoming data is newer
            if (!player.lastUpdated || updatedPlayer.lastUpdated > player.lastUpdated) {
              // Calculate distance between current and new position
              const currentPos = player.position || [0, 0, 0];
              const newPos = updatedPlayer.position;
              const distance = Math.sqrt(
                Math.pow(newPos[0] - currentPos[0], 2) +
                Math.pow(newPos[1] - currentPos[1], 2) +
                Math.pow(newPos[2] - currentPos[2], 2)
              );
              
              // For large position changes (teleports), skip interpolation
              const skipInterpolation = distance > 10;
              
              return {
                ...player,
                // Update direction
                direction: updatedPlayer.direction || player.direction,
                // Update alive status
                isAlive: updatedPlayer.isAlive !== undefined ? updatedPlayer.isAlive : player.isAlive,
                // If skipping interpolation, directly set position
                ...(skipInterpolation ? {
                  position: [...newPos],
                  currentPosition: [...newPos],
                  targetPosition: [...newPos],
                  interpolating: false
                } : {
                  // Keep the current position for interpolation
                  currentPosition: player.currentPosition || player.position,
                  // Set the new target position
                  targetPosition: newPos,
                  // Update the canonical position
                  position: player.position,
                  // Mark as interpolating
                  interpolating: true
                }),
                // Update timestamp
                lastUpdated: updatedPlayer.lastUpdated
              };
            }
          }
          return player;
        });
      });
    });
    
    // Handle projectile creation
    channel.on('broadcast', { event: 'projectile_fired' }, (payload) => {
      const projectileData = payload.payload;
      
      // Don't process our own projectiles (we already added them)
      if (projectileData.ownerId === userId.current) return;
      
      // Add the projectile to our list
      setProjectiles(prev => {
        return [
          ...prev, 
          {
            ...projectileData,
            position: [...projectileData.position],
            createdAt: Date.now()
          }
        ];
      });
    });
    
    // Handle player hit events
    channel.on('broadcast', { event: 'player_hit' }, (payload) => {
      const hitData = payload.payload;
      
      // If we were hit
      if (hitData.playerId === userId.current) {
        // Show game over message
        setGameOverMessage(\`You were eliminated by \${hitData.shooterName}!\`);
        isGameOver.current = true;
        
        // Update our local player state
        setLocalPlayer(prev => {
          const updated = {
            ...prev,
            isAlive: false
          };
          localPlayerRef.current = updated; // Update ref too
          return updated;
        });
        
        // After 3 seconds, respawn
        setTimeout(() => {
          respawnPlayer();
        }, 3000);
      }
      
      // Update the hit player in our list
      setPlayers(prevPlayers => {
        return prevPlayers.map(player => {
          if (player.id === hitData.playerId) {
            return {
              ...player,
              isAlive: false
            };
          }
          return player;
        });
      });
    });
    
    // Subscribe to channel
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track presence
        await channel.track(initialPlayerState);
        setIsConnected(true);
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

  // Periodic position broadcast to ensure consistency
  useEffect(() => {
    if (!localPlayer || !channelRef.current || !isConnected) return;
    
    // Broadcast position every 2 seconds regardless of movement
    const interval = setInterval(() => {
      // Update timestamp for the broadcast
      const updatedPlayer = {
        ...localPlayer,
        lastUpdated: Date.now()
      };
      
      // Broadcast position
      channelRef.current.send({
        type: 'broadcast',
        event: 'player_update',
        payload: updatedPlayer
      });
      
      // Update presence data
      channelRef.current.track(updatedPlayer);
    }, 2000);
    
    return () => clearInterval(interval);
  }, [localPlayer, isConnected]);
  
  // Handle key down events
  const handleKeyDown = (e) => {
    keysPressed.current[e.code] = true;
    
    // Shoot when Enter is pressed
    if (e.code === 'Enter' || e.code === 'NumpadEnter') {
      if (canShoot.current && !isGameOver.current && localPlayerRef.current?.isAlive !== false) {
        shootProjectile();
      }
    }
  };
  
  // Handle key up events
  const handleKeyUp = (e) => {
    keysPressed.current[e.code] = false;
  };
  
  // Function to shoot a projectile
  const shootProjectile = () => {
    // Use the ref instead of the state
    const player = localPlayerRef.current;
    
    if (!player) {
      return;
    }
    
    const now = Date.now();
    
    // Check cooldown
    if (now - lastShootTime.current < SHOOT_COOLDOWN) {
      return;
    }
    
    lastShootTime.current = now;
    canShoot.current = false;
    
    // Reset cooldown after delay
    setTimeout(() => {
      canShoot.current = true;
    }, SHOOT_COOLDOWN);
    
    // Create projectile data
    const projectileData = {
      id: \`\${userId.current}-\${now}\`,
      ownerId: userId.current,
      ownerName: player.username,
      position: [
        player.position[0] + player.direction[0] * 0.7, // Offset from player
        player.position[1] + 0.5, // Slightly above center
        player.position[2] + player.direction[2] * 0.7
      ],
      direction: [...player.direction],
      color: player.color,
      createdAt: now
    };
    
    try {
      // Add to local projectiles
      setProjectiles(prev => {
        const newProjectiles = [...prev, projectileData];
        return newProjectiles;
      });
      
      // Broadcast projectile creation
      channelRef.current.send({
        type: 'broadcast',
        event: 'projectile_fired',
        payload: projectileData
      });
    } catch (error) {
      console.error('Error creating projectile:', error);
    }
  };
  
  // Function to handle player hit
  const handlePlayerHit = (playerId, shooterId, shooterName) => {
    // Don't process hits for dead players
    const hitPlayer = players.find(p => p.id === playerId);
    if (!hitPlayer || hitPlayer.isAlive === false) return;
    
    // Broadcast hit
    channelRef.current.send({
      type: 'broadcast',
      event: 'player_hit',
      payload: {
        playerId,
        shooterId,
        shooterName
      }
    });
    
    // If we hit someone else
    if (playerId !== userId.current && shooterId === userId.current) {
      // Show elimination message
      setGameOverMessage(\`You eliminated \${hitPlayer.username}!\`);
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setGameOverMessage('');
      }, 3000);
    }
  };
  
  // Function to respawn player
  const respawnPlayer = () => {
    if (!localPlayerRef.current) return;
    
    // Get a random spawn position
    const spawnPos = SPAWN_POSITIONS[Math.floor(Math.random() * SPAWN_POSITIONS.length)];
    
    // Update local player position and state
    setLocalPlayer(prev => {
      if (!prev) return prev;
      
      const updated = {
        ...prev,
        position: [...spawnPos],
        isAlive: true,
        lastUpdated: Date.now()
      };
      
      // Update ref too
      localPlayerRef.current = updated;
      
      return updated;
    });
    
    // Clear game over message
    setGameOverMessage('');
    isGameOver.current = false;
  };
  
  // Update projectiles and check for collisions
  useEffect(() => {
    if (projectiles.length === 0) return;
    
    // Move projectiles and check for collisions
    const interval = setInterval(() => {
      setProjectiles(prev => {
        // Move projectiles
        const updatedProjectiles = prev.map(projectile => {
          // Calculate new position
          const newPosition = [
            projectile.position[0] + projectile.direction[0] * PROJECTILE_SPEED * 0.016, // 16ms frame time
            projectile.position[1] - 0.05, // Add gravity effect
            projectile.position[2] + projectile.direction[2] * PROJECTILE_SPEED * 0.016
          ];
          
          return {
            ...projectile,
            position: newPosition
          };
        });
        
        // Check for collisions with players
        updatedProjectiles.forEach(projectile => {
          // Skip projectiles from dead players
          const owner = players.find(p => p.id === projectile.ownerId);
          if (owner && owner.isAlive === false) return;
          
          // Check collision with each player
          players.forEach(player => {
            // Skip collision with owner or dead players
            if (player.id === projectile.ownerId || player.isAlive === false) return;
            
            // Calculate distance between projectile and player
            const dx = projectile.position[0] - player.position[0];
            const dy = projectile.position[1] - player.position[1];
            const dz = projectile.position[2] - player.position[2];
            const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
            
            // If collision detected
            if (distance < PLAYER_SIZE[0]/2 + PROJECTILE_SIZE/2) {
              // Handle hit
              handlePlayerHit(player.id, projectile.ownerId, projectile.ownerName);
            }
          });
        });
        
        // Remove old projectiles (older than 5 seconds)
        const now = Date.now();
        const filtered = updatedProjectiles.filter(p => now - p.createdAt < 5000);
        
        return filtered;
      });
    }, 16); // 60fps
    
    return () => clearInterval(interval);
  }, [projectiles, players]);
  
  return (
    <div className="flex flex-col h-screen bg-neutral-900 text-neutral-300 font-sans">
      {/* Toolbar */}
      <div className="flex gap-2 flex-wrap absolute top-4 right-4 z-10">
        {players.map((user, index) => (
          <div 
            key={index} 
            className={\`flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-800 text-xs\`}
          >
            <div className={\`w-1 h-1 rounded-full \${
              user.isAlive === false ? 'bg-neutral-500' : 'bg-green-400'
            }\`}></div>
            <span>{user.username}</span>
          </div>
        ))}
    </div>
      
      {/* Main content */}
      <div className="flex-1 relative overflow-hidden">
        <Canvas shadows camera={{ position: [0, 4.5, 8], fov: 80 }}>
          <color attach="background" args={['#000000']} />
          <fog attach="fog" args={['#000000', 15, 25]} />
          
          {/* Three-point lighting setup */}
          <ambientLight intensity={0.5} />

          {/* Key light - main light source */}
          <directionalLight
            color="#ffc9f9"
            intensity={1.5}
            position={[-5, 8, 5]}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />

          {/* Fill light - fills in shadows */}
          <directionalLight
            color="#bdefff"
            intensity={0.8}
            position={[5, 5, 3]}
            castShadow={false}
          />

          {/* Rim light - creates separation */}
          <directionalLight
            color="#ffffff"
            intensity={0.6}
            position={[0, 6, -2]}
            castShadow={false}
          />

          {/* Additional spot light for dramatic effect */}
          <spotLight
            position={[0, 15, 0]}
            angle={0.3}
            penumbra={0.8}
            intensity={1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          
          <Physics gravity={[0, GRAVITY, 0]}>
            {/* Ground */}
            <Ground position={[0, -0.5, 0]} />
            
            {/* Platforms */}
            <Platform position={[-3, 1, 0]} size={[2, 0.5, 2]} />
            <Platform position={[3, 2, 0]} size={[2, 0.5, 2]} />
            <Platform position={[0, 3, 0]} size={[2, 0.5, 2]} />
            
            {/* Players */}
            {players.map((player) => (
              <Player 
                key={player.id} 
                player={player} 
                isLocal={player.id === userId.current}
                keysPressed={keysPressed.current}
                setLocalPlayer={setLocalPlayer}
              />
            ))}
          </Physics>
          
          {/* Projectiles - rendered outside physics system for simplicity */}
          {projectiles.length > 0 && (
            <>
              {projectiles.map((projectile) => (
                <Projectile 
                  key={projectile.id} 
                  position={projectile.position} 
                  color={projectile.color} 
                />
              ))}
            </>
          )}
          
          {/* Interpolation manager - handles smooth transitions for remote players */}
          <InterpolationManager 
            players={players} 
            setPlayers={setPlayers} 
            localPlayerId={userId.current} 
          />
          
          <OrbitControls 
            enableZoom={true} 
            enablePan={false} 
            enableRotate={true}
            target={[0, 0, 0]}
            maxPolarAngle={Math.PI / 2}
          />
        </Canvas>
        
        {/* Game over message */}
        {gameOverMessage && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-neutral-300 px-8 py-6 rounded-lg font-bold text-2xl text-center border border-neutral-700">
            {gameOverMessage}
          </div>
        )}
      </div>
    </div>
  );
}

// Projectile component - simplified version without physics
function Projectile({ position, color }) {
  // Add ref to track mounting
  const ref = useRef();
  
  // Make projectiles slightly smaller
  return (
    <mesh 
      position={position} 
      castShadow
      ref={ref}
    >
      <boxGeometry args={[PROJECTILE_SIZE * 1.5, PROJECTILE_SIZE * 1.5, PROJECTILE_SIZE * 1.5]} />
      <meshStandardMaterial 
        color="#ffffff" 
        emissive={color || "#ffffff"}
        emissiveIntensity={1.5}
        metalness={0.9}
        roughness={0.1}
      />
    </mesh>
  );
}

// Interpolation manager component - must be inside Canvas
function InterpolationManager({ players, setPlayers, localPlayerId }) {
  // Track last update time for each player
  const lastUpdateTimes = useRef({});
  
  // Run on every frame
  useFrame((state, delta) => {
    // Skip if no players
    if (players.length === 0) return;
    
    const now = Date.now();
    
    // Update players with interpolation
    setPlayers(prevPlayers => {
      // Check if any players need interpolation
      let needsUpdate = false;
      
      const updatedPlayers = prevPlayers.map(player => {
        // Skip local player
        if (player.id === localPlayerId) return player;
        
        // Skip if not interpolating
        if (!player.interpolating) return player;
        
        // Update last activity time
        lastUpdateTimes.current[player.id] = now;
        
        // Calculate interpolation step (faster for bigger distances)
        const distance = Math.sqrt(
          Math.pow(player.targetPosition[0] - player.currentPosition[0], 2) +
          Math.pow(player.targetPosition[1] - player.currentPosition[1], 2) +
          Math.pow(player.targetPosition[2] - player.currentPosition[2], 2)
        );
        
        // Adaptive interpolation speed based on distance
        const adaptiveSpeed = INTERPOLATION_SPEED * (1 + Math.min(distance, 5));
        const lerpAmount = Math.min(adaptiveSpeed * delta, 1);
        
        // Create new interpolated position
        const newPosition = [
          MathUtils.lerp(player.currentPosition[0], player.targetPosition[0], lerpAmount),
          MathUtils.lerp(player.currentPosition[1], player.targetPosition[1], lerpAmount),
          MathUtils.lerp(player.currentPosition[2], player.targetPosition[2], lerpAmount)
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
            currentPosition: [...player.targetPosition],
            interpolating: false
          };
        } else {
          // Still interpolating
          needsUpdate = true;
          return {
            ...player,
            position: newPosition,
            currentPosition: newPosition
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
function Ground(props) {
  const [ref] = usePlane(() => ({ 
    rotation: [-Math.PI / 2, 0, 0], 
    ...props,
    type: 'Static'
  }));
  
  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[20, 20, 50, 50]} />
      <meshStandardMaterial 
        color="#444444" 
        metalness={0.4}
        roughness={0.5}
        emissive="#222222"
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}

// Platform component
function Platform({ position, size }) {
  const [ref] = useBox(() => ({ 
    position, 
    args: size,
    type: 'Static'
  }));
  
  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial 
        color="#666666" 
        metalness={0.6}
        roughness={0.3}
        emissive="#333333"
        emissiveIntensity={0.4}
      />
    </mesh>
  );
}

// Player component
function Player({ player, isLocal, keysPressed, setLocalPlayer }) {
  // Use physics for local player, but not for remote players
  const [ref, api] = useBox(() => ({ 
    mass: isLocal ? 1 : 0, // No physics for remote players
    position: player.position,
    args: PLAYER_SIZE,
    allowSleep: false,
    fixedRotation: true,
    type: isLocal ? 'Dynamic' : 'Kinematic' // Kinematic for remote players
  }));
  
  const isJumping = useRef(false);
  const positionRef = useRef(player.position);
  const velocityRef = useRef([0, 0, 0]);
  const lastBroadcastRef = useRef(Date.now());
  const lastPositionRef = useRef(player.position);
  const directionRef = useRef(player.direction || [1, 0, 0]);
  
  // For remote players, directly update position from props
  useEffect(() => {
    if (!isLocal) {
      // Only update position if it's significantly different
      const currentPos = positionRef.current || [0, 0, 0];
      const newPos = player.position;
      
      const distance = Math.sqrt(
        Math.pow(newPos[0] - currentPos[0], 2) +
        Math.pow(newPos[1] - currentPos[1], 2) +
        Math.pow(newPos[2] - currentPos[2], 2)
      );
      
      // Update position if it's different enough
      if (distance > 0.01) {
        api.position.set(...player.position);
        positionRef.current = player.position;
      }
    }
  }, [player.position, isLocal, api.position]);
  
  // Subscribe to position changes
  useEffect(() => {
    const unsubscribe = api.position.subscribe((p) => {
      positionRef.current = p;
      
      // Only update local player position
      if (isLocal) {
        const now = Date.now();
        
        // Update player direction based on movement
        if (keysPressed['ArrowLeft'] || keysPressed['KeyA']) {
          directionRef.current = [-1, 0, 0]; // Left
        } else if (keysPressed['ArrowRight'] || keysPressed['KeyD']) {
          directionRef.current = [1, 0, 0]; // Right
        }
        
        lastPositionRef.current = [...p];
        
        // Throttle broadcasts to avoid overwhelming the network
        // Only update if enough time has passed since last broadcast
        if (now - lastBroadcastRef.current > BROADCAST_THROTTLE) {
          lastBroadcastRef.current = now;
          
          // Use a smaller threshold to detect more subtle movements
          const dx = Math.abs(player.position[0] - p[0]);
          const dy = Math.abs(player.position[1] - p[1]);
          const dz = Math.abs(player.position[2] - p[2]);
          
          if (dx > 0.001 || dy > 0.001 || dz > 0.001) {
            setLocalPlayer(prev => {
              if (!prev) return prev;
              
              return {
                ...prev,
                position: [p[0], p[1], p[2]],
                direction: directionRef.current,
                lastUpdated: now
              };
            });
          }
        }
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [api, isLocal, setLocalPlayer, player.position, keysPressed]);
  
  // Handle controls for local player
  useEffect(() => {
    if (!isLocal || player.isAlive === false) return;
    
    const velocityUnsubscribe = api.velocity.subscribe((velocity) => {
      // Store current velocity for use in the interval
      velocityRef.current = velocity;
    });
    
    const interval = setInterval(() => {
      // Use the stored velocity
      const v = velocityRef.current || [0, 0, 0];
      let newVelocity = [...v];
      
      // Handle left/right movement
      if (keysPressed['ArrowLeft'] || keysPressed['KeyA']) {
        newVelocity[0] = -MOVE_SPEED;
      } else if (keysPressed['ArrowRight'] || keysPressed['KeyD']) {
        newVelocity[0] = MOVE_SPEED;
      } else {
        newVelocity[0] *= 0.8; // Apply friction
      }
      
      // Handle jumping
      if ((keysPressed['ArrowUp'] || keysPressed['KeyW']) && !isJumping.current) {
        // Simple ground check - if y velocity is very small, assume we're on ground
        if (Math.abs(v[1]) < 0.1) {
          newVelocity[1] = JUMP_FORCE;
          isJumping.current = true;
          
          // Reset jumping state after a short delay
          setTimeout(() => {
            isJumping.current = false;
          }, 500);
        }
      }
      
      // Apply new velocity
      api.velocity.set(newVelocity[0], newVelocity[1], newVelocity[2]);
    }, 10); // 100fps for smoother controls
    
    return () => {
      clearInterval(interval);
      velocityUnsubscribe();
    };
  }, [api, isLocal, keysPressed, player.isAlive]);
  
  // Apply visual effects for dead players
  const playerColor = player.isAlive === false ? '#333333' : player.color;
  const playerOpacity = player.isAlive === false ? 0.3 : 1;

  return (
    <group>
      {/* Player cube */}
      <mesh ref={ref} castShadow receiveShadow>
        <boxGeometry args={PLAYER_SIZE} />
        <meshStandardMaterial 
          color={playerColor} 
          transparent={player.isAlive === false}
          opacity={playerOpacity}
          metalness={0.5}
          roughness={0.4}
          emissive={player.isAlive ? playerColor : "#000000"}
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Player name */}
      <Text
        position={[
          player.position[0], 
          player.position[1] + 1.2, 
          player.position[2]
        ]}
        fontSize={0.5}
        color={player.isAlive === false ? '#555555' : '#cccccc'}
        anchorX="center"
        anchorY="middle"
      >
        {player.username}
      </Text>
    </group>
  );
}
`

  const platformer3DFiles = {
    '/App.js': appJsCode,
    '/styles.css': `/* No custom CSS needed - using Tailwind */

/* Game-specific styles that can't be handled by Tailwind */
canvas {
  width: 100%;
  height: 100%;
}

.game-over-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
}
`,
  }

  return (
    <ExampleLayout
      appJsCode={appJsCode}
      files={platformer3DFiles}
      dependencies={{
        '@react-three/fiber': 'latest',
        '@react-three/cannon': 'latest',
        '@react-three/drei': 'latest',
        three: 'latest',
        tailwindcss: 'latest',
        postcss: 'latest',
        autoprefixer: 'latest',
      }}
      title="3D Platformer Example"
      description="An immersive 3D multiplayer platformer game where players navigate a physics-based environment, collect coins, and interact with each other. This advanced example demonstrates real-time position synchronization, 3D physics with jumping and collision detection, projectile shooting mechanics, and player presence with usernames. Built with Three.js and React Three Fiber, it showcases sophisticated game development concepts including interpolated movement, optimized network updates, and responsive controls in a 3D space."
    />
  )
}
