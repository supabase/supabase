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

// Generate a unique instance ID for this session
const instanceId = '${instanceId}';

// Channel name for the todos in this instance
const CHANNEL = \`todos:\${instanceId}\`;
const TABLE = 'todos';

export default function App() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sign in anonymously and store instanceId in user metadata
  useEffect(() => {
    const signInAnonymously = async () => {
      try {
        const { data, error } = await supabase.auth.signInAnonymously({
          options: {
            data: { instanceId }
          }
        });
        
        if (error) {
          console.error('Error signing in anonymously:', error.message);
          return;
        }
        
        setUser(data.user);
        console.log('Signed in anonymously with user ID:', data.user.id);
      } catch (error) {
        console.error('Unexpected error during sign in:', error.message);
      }
    };
    
    signInAnonymously();
  }, []);

  // Fetch todos from the database when user is authenticated
  useEffect(() => {
    if (!user) return;
    
    const fetchTodos = async () => {
      try {
        const { data, error } = await supabase
          .from(TABLE)
          .select('*')
          .eq('channel', instanceId)
          
        if (error) {
          console.error('Error fetching todos:', error.message);
          return;
        }
        
        setTodos(data || []);
        setIsLoading(false);
      } catch (error) {
        console.error('Unexpected error fetching todos:', error.message);
      }
    };
    
    fetchTodos();
    
    const setupRealtimeChannel = async () => {
      await supabase.realtime.setAuth(); // Needed for Realtime Authorization
      const changes = supabase
        .channel(CHANNEL, {
          config: { private: true },
        })
        .on('broadcast', { event: 'INSERT' }, (payload) => {
          const { record: todo } = payload.payload;
          setTodos(prev => [...prev, todo]);
        })
        .on('broadcast', { event: 'UPDATE' }, (payload) => {
          const { record: todo } = payload.payload;
          setTodos(prev => 
            prev.map(t => t.id === todo.id ? todo : t)
          );
        })
        .on('broadcast', { event: 'DELETE' }, (payload) => {
          console.log('DELETE', payload);
          const { old_record: todo } = payload.payload;
          setTodos(prev => prev.filter(t => t.id !== todo.id));
        })
        .subscribe();
    };
    setupRealtimeChannel();
    
  }, [user, instanceId]);

  useEffect(() => {
    // Generate a random username
    const adjectives = ['Happy', 'Clever', 'Brave', 'Bright', 'Kind'];
    const nouns = ['Panda', 'Tiger', 'Eagle', 'Dolphin', 'Fox'];
    const randomName = \`\${adjectives[Math.floor(Math.random() * adjectives.length)]}\${
      nouns[Math.floor(Math.random() * nouns.length)]
    }\${Math.floor(Math.random() * 100)}\`;
    setUsername(randomName);

    // Subscribe to presence channel
    const presenceChannel = supabase.channel(\`presence:\${instanceId}\`);

    // Track presence state
    presenceChannel.on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.presenceState();
      const presenceList = [];
      
      // Convert presence state to array
      Object.keys(state).forEach(key => {
        const presences = state[key];
        presenceList.push(...presences);
      });
      
      setOnlineUsers(presenceList);
    });

    presenceChannel
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track presence
          await presenceChannel.track({
            user_id: user?.id || 'anonymous',
            username: randomName,
            online_at: new Date().getTime(),
          });
          setIsConnected(true);
        }
      });

    return () => {
      presenceChannel.unsubscribe();
    };
  }, [user?.id, instanceId]);

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim() || !isConnected || !user) return;

    try {
      // Insert the todo into the Supabase table
      // The database trigger will handle broadcasting
      const { error } = await supabase
        .from(TABLE)
        .insert({
          text: newTodo.trim(),
          completed: false,
          created_by: user.id,
          channel: instanceId
        });
        
      if (error) {
        console.error('Error adding todo:', error.message);
        return;
      }
      
      // Clear the input
      setNewTodo('');
    } catch (error) {
      console.error('Unexpected error adding todo:', error.message);
    }
  };

  const handleToggleTodo = async (todo) => {
    if (!isConnected || !user) return;

    try {
      // Update the todo in the database
      // The database trigger will handle broadcasting
      const { error } = await supabase
        .from(TABLE)
        .update({ completed: !todo.completed })
        .eq('id', todo.id)
        .eq('channel', instanceId);
        
      if (error) {
        console.error('Error updating todo:', error.message);
      }
    } catch (error) {
      console.error('Unexpected error updating todo:', error.message);
    }
  };

  const handleDeleteTodo = async (todo) => {
    if (!isConnected || !user) return;

    try {
      // Delete the todo from the database
      // The database trigger will handle broadcasting
      const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq('id', todo.id)
        
      if (error) {
        console.error('Error deleting todo:', error.message);
      }
    } catch (error) {
      console.error('Unexpected error deleting todo:', error.message);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-900 text-white antialiased">
      {/* Header */}
      <div className="flex justify-between items-center px-5 pt-3">
        <h1 className="font-medium text-sm text-neutral-400">
          {user ? 
            \`\${todos.filter((todo) => !todo.completed).length} todos to complete\` :
            'Connecting...'
          }
        </h1>
        <div className="flex gap-2 flex-wrap">
          {onlineUsers.map((user, index) => (
            <div 
              key={index} 
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-800 text-neutral-300 text-xs"
            >
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span>{user.username}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-hidden p-4">
        <div className="mx-auto">
          <div className="space-y-1">
            {isLoading ? (
              <div className="text-center py-8 text-neutral-500">
                Loading todos...
              </div>
            ) : (
              todos.map((todo) => (
                <div 
                  key={todo.id}
                  className="flex items-center justify-between p-3 rounded-md bg-neutral-800 border border-neutral-700"
                >
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleToggleTodo(todo)} 
                      className={\`w-5 h-5 rounded flex items-center justify-center border \${
                        todo.completed 
                          ? 'bg-green-900 border-green-700 text-green-400' 
                          : 'border-neutral-600'
                      }\`}
                    >
                      {todo.completed && (
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="12" 
                          height="12" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </button>
                    <span className={\`text-sm \${todo.completed ? 'line-through text-neutral-500' : 'text-neutral-200'}\`}>
                      {todo.text}
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => handleDeleteTodo(todo)}
                    className="text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="14" 
                      height="14" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
          
          <form onSubmit={handleAddTodo} className="mt-4 flex gap-2">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a new todo..."
              disabled={!isConnected || !user}
              className="flex-1 px-4 py-2 bg-neutral-800 text-neutral-100 border border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-600 focus:border-transparent placeholder-neutral-500"
            />
            <button
              type="submit"
              disabled={!newTodo.trim() || !isConnected || !user}
              className="px-4 py-2 bg-neutral-800 text-neutral-300 border border-neutral-700 rounded-md hover:bg-neutral-700 focus:outline-none disabled:opacity-50 disabled:hover:bg-neutral-800"
            >
              Add
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}`

const todoFiles = {
  '/App.js': appJsCode,
  '/styles.css': `/* No custom CSS needed - using Tailwind */`,
}

const layoutProps: ExampleLayoutProps = {
  appJsCode,
  files: todoFiles,
  title: 'Todo List',
  description:
    "A collaborative todo list application that lets multiple users manage tasks in real-time. Features include adding, completing, and deleting tasks, all synchronized instantly across devices. This example showcases real-time database changes and presence indicators showing who's online.",
}

export default layoutProps
