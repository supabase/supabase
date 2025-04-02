'use client'

import { ExampleLayoutProps } from '../example-layout'

const instanceId = Math.random().toString(36).substring(2, 9)

const appJsCode = `import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = '${process.env.NEXT_PUBLIC_EXAMPLES_SUPABASE_URL}';
const supabaseKey = '${process.env.NEXT_PUBLIC_EXAMPLES_SUPABASE_ANON_KEY}';
const supabase = createClient(supabaseUrl, supabaseKey);

// Channel name - using a unique ID to ensure both instances connect to the same channel
const CHANNEL = 'emoji-example-${instanceId}';

// List of emojis for the picker
const EMOJIS = ['👍', '❤️', '😂', '🎉', '🔥', '👏', '🚀', '✨', '🌈', '🦄'];

export default function App() {
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [animatingEmojis, setAnimatingEmojis] = useState([]);
  
  const userId = useRef(Math.random().toString(36).substring(2, 15));
  const channelRef = useRef(null);
  const containerRef = useRef(null);
  
  // Set up Supabase channel
  useEffect(() => {
    // Generate a random username
    const adjectives = ['Happy', 'Clever', 'Brave', 'Bright', 'Kind'];
    const nouns = ['Panda', 'Tiger', 'Eagle', 'Dolphin', 'Fox'];
    const randomName = \`\${adjectives[Math.floor(Math.random() * adjectives.length)]}\${
      nouns[Math.floor(Math.random() * nouns.length)]
    }\${Math.floor(Math.random() * 100)}\`;
    setUsername(randomName);
    
    // Subscribe to channel
    const channel = supabase.channel(CHANNEL, {
      config: {
        presence: {
          key: userId.current,
        },
      },
    });
    
    channelRef.current = channel;
    
    // Handle presence for user list
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const users = [];
      
      // Convert presence state to array
      Object.keys(state).forEach(key => {
        const presences = state[key];
        users.push(...presences);
      });
      
      setActiveUsers(users);
    });
    
    // Handle emoji click events
    channel.on('broadcast', { event: 'emoji_click' }, (payload) => {
      const { emoji, position, senderId } = payload.payload;
      
      // Don't animate our own emoji clicks (we already did that)
      if (senderId === userId.current) return;
      
      // Create a new animating emoji
      createAnimatingEmoji(emoji, position);
    });
    
    // Subscribe to channel
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track presence
        await channel.track({
          userId: userId.current,
          username: randomName,
          online_at: new Date().getTime()
        });
        
        setIsConnected(true);
      }
    });
    
    return () => {
      channel.unsubscribe();
    };
  }, []);
  
  // Clean up finished animations
  useEffect(() => {
    if (animatingEmojis.length > 0) {
      const timer = setTimeout(() => {
        setAnimatingEmojis(emojis => emojis.filter(e => Date.now() - e.timestamp < 2000));
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [animatingEmojis]);
  
  // Handle emoji click
  const handleEmojiClick = (emoji, event) => {
    if (!isConnected) return;
    
    // Get the position of the clicked emoji relative to the container
    const rect = event.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    const position = {
      x: rect.left + rect.width / 2 - containerRect.left,
      y: rect.top - containerRect.top
    };
    
    // Create a new animating emoji locally
    createAnimatingEmoji(emoji, position);
    
    // Broadcast the emoji click to other clients
    channelRef.current.send({
      type: 'broadcast',
      event: 'emoji_click',
      payload: {
        emoji,
        position,
        senderId: userId.current
      }
    });
  };
  
  // Create a new animating emoji
  const createAnimatingEmoji = (emoji, position) => {
    const newEmoji = {
      id: Date.now() + Math.random(),
      emoji,
      position,
      timestamp: Date.now()
    };
    
    setAnimatingEmojis(emojis => [...emojis, newEmoji]);
  };
  
  return (
    <div className="h-screen flex flex-col bg-neutral-800 text-white relative overflow-hidden antialiased" ref={containerRef}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 absolute top-4 right-4">
        {activeUsers.map((user, index) => (
          <div 
            key={index} 
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 text-neutral-300 text-xs"
          >
            <div className="w-1 h-1 rounded-full bg-green-400"></div>
            <span>{user.username}</span>
          </div>
        ))}
      </div>
      
      {/* Main content */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0">
          {/* Animating emojis */}
          {animatingEmojis.map((emojiObj) => (
            <div 
              key={emojiObj.id}
              className="absolute text-2xl pointer-events-none animate-float-up"
              style={{
                left: \`\${emojiObj.position.x}px\`,
                top: \`\${emojiObj.position.y}px\`,
                transform: 'translate(-50%, -50%)',
                animation: 'float-up 2s ease-out forwards'
              }}
            >
              {emojiObj.emoji}
            </div>
          ))}
          
          {/* Instructions */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <h2 className="font-medium text-neutral-300 mb-2">Click an emoji below to send a reaction!</h2>
            <p className="text-neutral-400">All connected users will see your reactions in real-time.</p>
          </div>
        </div>
      </div>
      
      {/* Emoji picker bar */}
      <div className="flex justify-center items-center p-4 border-t border-neutral-700/50 z-10">
        {EMOJIS.map((emoji) => (
          <button 
            key={emoji} 
            className="text-2xl flex justify-center items-center w-16 h-16 rounded-full hover:bg-neutral-800 active:scale-90 transition-all duration-200"
            onClick={(e) => handleEmojiClick(emoji, e)}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}`

const emojiPickerFiles = {
  '/App.js': appJsCode,
  '/styles.css': `@keyframes float-up {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -300px) scale(1.5);
  }
}

.animate-float-up {
  animation: float-up 2s ease-out forwards;
}`,
}

const layoutProps: ExampleLayoutProps = {
  appJsCode,
  files: emojiPickerFiles,
  title: 'Emoji Picker',
  description:
    "An interactive emoji reaction system that uses Supabase Realtime's broadcast channel to sync emoji reactions across multiple users in real-time.",
}

export default layoutProps
