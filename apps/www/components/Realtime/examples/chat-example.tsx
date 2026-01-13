'use client'

import type { ExampleLayoutProps } from '../example-layout'

const instanceId = Math.random().toString(36).substring(2, 9)

const appJsCode = `import { useEffect, useState, useRef } from 'react';
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
const CHANNEL = 'chat-example-${instanceId}';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    // Generate a random username
    const adjectives = ['Happy', 'Clever', 'Brave', 'Bright', 'Kind'];
    const nouns = ['Panda', 'Tiger', 'Eagle', 'Dolphin', 'Fox'];
    const randomName = \`\${adjectives[Math.floor(Math.random() * adjectives.length)]}\${
      nouns[Math.floor(Math.random() * nouns.length)]
    }\${Math.floor(Math.random() * 100)}\`;
    setUsername(randomName);

    // Subscribe to broadcast channel
    const channel = supabase.channel(CHANNEL);

    // Track presence state
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const presenceList = [];
      
      // Convert presence state to array
      Object.keys(state).forEach(key => {
        const presences = state[key];
        presenceList.push(...presences);
      });
      
      setOnlineUsers(presenceList);
    });

    channel
      .on('broadcast', { event: 'message' }, (payload) => {
        setMessages((prev) => [...prev, payload.payload]);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track presence
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
      channel.unsubscribe();
    };
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !isConnected) return;

    const message = {
      id: Math.random().toString(36).substring(2, 15),
      user_id: userId,
      username,
      avatar: getAvatarUrl(userId),
      text: newMessage.trim(),
      created_at: Date.now(),
    };

    // Broadcast the message
    supabase.channel(CHANNEL).send({
      type: 'broadcast',
      event: 'message',
      payload: message,
    });

    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-900 text-white antialiased">
      {/* Header */}
      <div className="flex gap-2 flex-wrap absolute top-4 right-4 z-10">
        {onlineUsers.map((user) => (
          <div 
            key={user.user_id} 
            className="flex items-center text-xs justify-center rounded-full w-8 h-8 bg-neutral-700 text-neutral-300"
            title={user.username}
          >
            <span>{user.username[0]}</span>
          </div>
        ))}
      </div>
      
      {/* Main content */}
      <div className="flex-1 p-6">
        <div className="h-full flex flex-col max-w-3xl mx-auto">
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-neutral-500">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg, index) => {
                const prevMsg = index > 0 ? messages[index - 1] : null;
                const showHeader = !prevMsg || prevMsg.user_id !== msg.user_id;
                
                return (
                  <div 
                    key={msg.id} 
                  >
                    <div className="max-w-[70%] w-fit">
                      {showHeader && (
                        <div className="flex items-center gap-2  text-xs mb-2 mt-4">
                          <span className={\`font-medium \${msg.user_id === userId ? 'text-neutral-300' : 'text-neutral-400'}\`}>
                            {msg.username}
                          </span>
                          <span className="text-neutral-500">
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                      <div className={\`text-neutral-100 py-2 px-3 rounded-xl text-sm mb-1 w-fit \${
                        msg.user_id === userId 
                          ? 'bg-blue-500 text-blue-50' 
                          : 'bg-neutral-800 text-neutral-100'
                      }\`}>{msg.text}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <form onSubmit={handleSendMessage} className="flex w-full gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage(e);
                }
              }}
              placeholder="Type a message..."
              disabled={!isConnected}
              className="flex-1 px-4 py-2 bg-neutral-800 text-neutral-100 border-none rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-600 focus:border-transparent placeholder-neutral-500"
            />
          </form>
        </div>
      </div>
    </div>
  );
}`

const chatFiles = {
  '/App.js': appJsCode,
  '/styles.css': `/* No custom CSS needed - using Tailwind */`,
}

const layoutProps: ExampleLayoutProps = {
  appJsCode,
  files: chatFiles,
  title: 'Chat Example',
  description:
    "A real-time chat application that uses Supabase Realtime's broadcast and presence features to enable instant messaging and show online users.",
}

export default layoutProps
