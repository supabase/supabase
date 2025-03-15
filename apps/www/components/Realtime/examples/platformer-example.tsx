'use client'

import { useState } from 'react'
import ExampleLayout from '../example-layout'

export default function PlatformerExample() {
  const [instanceId] = useState(() => Math.random().toString(36).substring(2, 9))

  const appJsCode = `import { useEffect, useState, useRef } from 'react';
import './styles.css';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = '${process.env.NEXT_PUBLIC_SUPABASE_URL}';
const supabaseKey = '${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}';
const supabase = createClient(supabaseUrl, supabaseKey);

// Channel name - using a unique ID to ensure both instances connect to the same channel
const CHANNEL = 'platformer-example-${instanceId}';

// Game constants
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const MOVE_SPEED = 5;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 60;

// Platform positions
const PLATFORMS = [
  { x: 0, y: 400, width: 800, height: 20 },
  { x: 150, y: 300, width: 200, height: 20 },
  { x: 450, y: 300, width: 200, height: 20 },
  { x: 300, y: 200, width: 200, height: 20 },
];

export default function App() {
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [players, setPlayers] = useState([]);
  const [localPlayer, setLocalPlayer] = useState(null);
  
  const userId = useRef(Math.random().toString(36).substring(2, 15));
  const channelRef = useRef(null);
  const gameLoopRef = useRef(null);
  const keysPressed = useRef({});
  const gameContainerRef = useRef(null);
  
  // Initialize game
  useEffect(() => {
    // Generate a random username
    const adjectives = ['Happy', 'Clever', 'Brave', 'Bright', 'Kind'];
    const nouns = ['Panda', 'Tiger', 'Eagle', 'Dolphin', 'Fox'];
    const randomName = \`\${adjectives[Math.floor(Math.random() * adjectives.length)]}\${
      nouns[Math.floor(Math.random() * nouns.length)]
    }\${Math.floor(Math.random() * 100)}\`;
    setUsername(randomName);
    
    // Create initial player state
    const initialPlayerState = {
      id: userId.current,
      username: randomName,
      x: Math.random() * 700 + 50, // Random starting position
      y: 0,
      vx: 0,
      vy: 0,
      isJumping: false,
      color: getRandomColor(),
      lastUpdated: Date.now()
    };
    
    setLocalPlayer(initialPlayerState);
    
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
            return localPlayer || presence;
          }
          
          // For other players, find their previous state or use presence data
          const existingPlayer = prevPlayers.find(p => p.id === presence.id);
          return existingPlayer || presence;
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
              return updatedPlayer;
            }
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
    
    // Start game loop
    startGameLoop();
    
    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, []);
  
  // Update local player when it changes
  useEffect(() => {
    if (localPlayer && channelRef.current && isConnected) {
      // Broadcast our updated position
      channelRef.current.send({
        type: 'broadcast',
        event: 'player_update',
        payload: localPlayer
      });
      
      // Update our presence data
      channelRef.current.track(localPlayer);
    }
  }, [localPlayer, isConnected]);
  
  // Handle key down events
  const handleKeyDown = (e) => {
    keysPressed.current[e.code] = true;
  };
  
  // Handle key up events
  const handleKeyUp = (e) => {
    keysPressed.current[e.code] = false;
  };
  
  // Start the game loop
  const startGameLoop = () => {
    const gameLoop = () => {
      updateLocalPlayer();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };
  
  // Update the local player's position based on input and physics
  const updateLocalPlayer = () => {
    if (!localPlayer) return;
    
    // Create a copy of the player state
    const updatedPlayer = { ...localPlayer };
    
    // Apply horizontal movement
    if (keysPressed.current['ArrowLeft'] || keysPressed.current['KeyA']) {
      updatedPlayer.vx = -MOVE_SPEED;
    } else if (keysPressed.current['ArrowRight'] || keysPressed.current['KeyD']) {
      updatedPlayer.vx = MOVE_SPEED;
    } else {
      // Apply friction
      updatedPlayer.vx *= 0.8;
      if (Math.abs(updatedPlayer.vx) < 0.1) updatedPlayer.vx = 0;
    }
    
    // Apply jump if on ground
    if ((keysPressed.current['Space'] || keysPressed.current['ArrowUp'] || keysPressed.current['KeyW']) && !updatedPlayer.isJumping) {
      updatedPlayer.vy = JUMP_FORCE;
      updatedPlayer.isJumping = true;
    }
    
    // Apply gravity
    updatedPlayer.vy += GRAVITY;
    
    // Update position
    updatedPlayer.x += updatedPlayer.vx;
    updatedPlayer.y += updatedPlayer.vy;
    
    // Check for collisions with platforms
    let onGround = false;
    
    for (const platform of PLATFORMS) {
      // Check if player is colliding with this platform
      if (
        updatedPlayer.x + PLAYER_WIDTH > platform.x &&
        updatedPlayer.x < platform.x + platform.width &&
        updatedPlayer.y + PLAYER_HEIGHT > platform.y &&
        updatedPlayer.y + PLAYER_HEIGHT < platform.y + platform.height + 10 && // Add a small buffer for better collision
        updatedPlayer.vy >= 0 // Only collide when falling
      ) {
        updatedPlayer.y = platform.y - PLAYER_HEIGHT;
        updatedPlayer.vy = 0;
        updatedPlayer.isJumping = false;
        onGround = true;
        break;
      }
    }
    
    // If not on any platform and below the ground, reset to ground level
    if (!onGround && updatedPlayer.y + PLAYER_HEIGHT > 400) {
      updatedPlayer.y = 400 - PLAYER_HEIGHT;
      updatedPlayer.vy = 0;
      updatedPlayer.isJumping = false;
    }
    
    // Constrain to game bounds
    if (updatedPlayer.x < 0) updatedPlayer.x = 0;
    if (updatedPlayer.x + PLAYER_WIDTH > 800) updatedPlayer.x = 800 - PLAYER_WIDTH;
    
    // Update timestamp
    updatedPlayer.lastUpdated = Date.now();
    
    // Only update if something changed
    if (
      updatedPlayer.x !== localPlayer.x ||
      updatedPlayer.y !== localPlayer.y ||
      updatedPlayer.vx !== localPlayer.vx ||
      updatedPlayer.vy !== localPlayer.vy ||
      updatedPlayer.isJumping !== localPlayer.isJumping
    ) {
      setLocalPlayer(updatedPlayer);
    }
  };
  
  // Generate a random color for the player
  const getRandomColor = () => {
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33A8', '#33FFF6'];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  return (
    <div className="app-container">
      {/* Toolbar */}
      <div className="toolbar">
        <h1>Multiplayer Platformer</h1>
        <div className="game-controls">
          <div className="controls-info">
            <span>Controls: Arrow Keys / WASD to move, Space to jump</span>
          </div>
          <div className="user-presence">
            {players.map((player) => (
              <div key={player.id} className="user-badge">
                <span>{player.username}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="main-content">
        <div className="game-container" ref={gameContainerRef}>
          {/* Render platforms */}
          {PLATFORMS.map((platform, index) => (
            <div
              key={index}
              className="platform"
              style={{
                left: \`\${platform.x}px\`,
                top: \`\${platform.y}px\`,
                width: \`\${platform.width}px\`,
                height: \`\${platform.height}px\`
              }}
            />
          ))}
          
          {/* Render players */}
          {players.map((player) => (
            <div
              key={player.id}
              className={\`player \${player.id === userId.current ? 'local-player' : ''}\`}
              style={{
                left: \`\${player.x}px\`,
                top: \`\${player.y}px\`,
                backgroundColor: player.color || '#FF5733'
              }}
            >
              <div className="player-name">{player.username}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}`

  const platformerFiles = {
    '/App.js': appJsCode,
    '/styles.css': `.app-container {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: white;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

h1 {
  color: #3ecf8e;
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
  color: #64748b;
}

.user-presence {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.user-badge {
  display: flex;
  align-items: center;
  background-color: #3ecf8e;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 14px;
  color: white;
}

.main-content {
  flex: 1;
  overflow: hidden;
  background-color: #f8f9fa;
  display: flex;
  justify-content: center;
  align-items: center;
}

.game-container {
  position: relative;
  width: 800px;
  height: 500px;
  background-color: #87CEEB; /* Sky blue background */
  overflow: hidden;
  border: 2px solid #64748b;
  border-radius: 8px;
}

.platform {
  position: absolute;
  background-color: #8B4513; /* Brown color for platforms */
  border-top: 4px solid #A0522D; /* Slightly lighter top edge */
}

.player {
  position: absolute;
  width: 40px;
  height: 60px;
  border-radius: 4px;
  transition: transform 0.1s ease;
}

.player::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 10px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 50%;
}

.local-player {
  border: 2px solid white;
}

.player-name {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 12px;
}`,
  }

  return (
    <ExampleLayout
      appJsCode={appJsCode}
      files={platformerFiles}
      title="Platformer Example"
      description="A 2D multiplayer platformer game where players can jump between platforms and interact in real-time. This example demonstrates character movement synchronization, physics simulation with gravity and collision detection, and player presence. Players can see each other moving through the game world with smooth animations and responsive controls. Perfect for learning how to build multiplayer browser games with Supabase Realtime."
    />
  )
}
