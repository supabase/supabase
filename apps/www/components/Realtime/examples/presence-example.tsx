'use client'

import type { ExampleLayoutProps } from '../example-layout'

const instanceId = Math.random().toString(36).substring(2, 9)

const appJsCode = `import { useEffect, useState } from 'react';
import './styles.css';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = '${process.env.NEXT_PUBLIC_EXAMPLES_SUPABASE_URL}';
const supabaseKey = '${process.env.NEXT_PUBLIC_EXAMPLES_SUPABASE_ANON_KEY}';
const supabase = createClient(supabaseUrl, supabaseKey);

// Generate a random user ID and avatar
const userId = Math.random().toString(36).substring(2, 15);
const getAvatarUrl = (id) => \`https://api.dicebear.com/7.x/avataaars/svg?seed=\${id}\`;

// Channel name - using a unique ID to ensure both instances connect to the same channel
const CHANNEL = 'presence-example-${instanceId}';

export default function App() {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Generate a random username
    const adjectives = ['Happy', 'Clever', 'Brave', 'Bright', 'Kind'];
    const nouns = ['Panda', 'Tiger', 'Eagle', 'Dolphin', 'Fox'];
    const randomName = \`\${adjectives[Math.floor(Math.random() * adjectives.length)]}\${
      nouns[Math.floor(Math.random() * nouns.length)]
    }\${Math.floor(Math.random() * 100)}\`;
    setUsername(randomName);

    // Subscribe to presence channel
    const channel = supabase.channel(CHANNEL);

    // Track presence state
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const presenceList = [];
        
        // Convert presence state to array
        Object.keys(state).forEach(key => {
          const presences = state[key];
          presenceList.push(...presences);
        });
        
        setOnlineUsers(presenceList);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Send presence state when subscribed
          await channel.track({
            user_id: userId,
            username: randomName,
            avatar: getAvatarUrl(userId),
            online_at: new Date().getTime(),
          });
          setIsConnected(true);
        }
      });

    return () => {
      // Clean up subscription
      channel.unsubscribe();
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-neutral-900 text-white antialiased">
      {/* Main content */}
      <div className="flex-1 overflow-hidden p-4">
        <div className="h-full max-w-3xl mx-auto flex flex-col gap-4 items-center justify-center">
          <h2 className="text-lg font-medium text-neutral-300 mb-6">
            Online Users ({onlineUsers.length})
          </h2>
          <div className="flex justify-center sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {onlineUsers.map((user) => (
              <div 
                key={user.user_id} 
                className="flex flex-col items-center gap-3"
              >
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-b from-neutral-700 to-neutral-800 shadow-neutral-900/75 shadow-[inset_0_0_20px_rgba(0,0,0,0.3)]">
                  <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-400 rounded-full"></div>
                </div>
                <span className="text-sm text-neutral-400 text-center break-words">
                  {user.username}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}`

const presenceFiles = {
  '/App.js': appJsCode,
  '/styles.css': `/* No custom CSS needed - using Tailwind */`,
}

const layoutProps: ExampleLayoutProps = {
  appJsCode,
  files: presenceFiles,
  title: 'Presence',
  description:
    "A demonstration of Supabase Realtime's presence feature that tracks and displays online users in real-time with their avatars and usernames.",
}

export default layoutProps
