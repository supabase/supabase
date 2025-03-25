'use client'

import { useState } from 'react'
import ExampleLayout from '../example-layout'

export default function TodoExample() {
  const [instanceId] = useState(() => Math.random().toString(36).substring(2, 9))

  const appJsCode = `import { useEffect, useState } from 'react';
import './styles.css';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = '${process.env.NEXT_PUBLIC_SUPABASE_REALTIME_URL}';
const supabaseKey = '${process.env.NEXT_PUBLIC_SUPABASE_REALTIME_ANON_KEY}';
const supabase = createClient(supabaseUrl, supabaseKey);

// Generate a unique instance ID for this session
const instanceId = '${instanceId}';

// Channel name for the todos in this instance
const CHANNEL = \`todos:\${instanceId}\`;

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
          .from('todos')
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
        .from('todos')
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
        .from('todos')
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
        .from('todos')
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
            ) : todos.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                No todos yet. Add one to get started!
              </div>
            ) : (
              todos.map((todo) => (
                <div 
                  key={todo.id} 
                  className="flex items-center justify-between gap-4 p-3 bg-neutral-800/50 rounded-lg group"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <label className="flex items-center cursor-pointer relative">
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => handleToggleTodo(todo)}
                        className="peer h-5 w-5 cursor-pointer transition-all appearance-none rounded shadow hover:shadow-md border border-neutral-600 checked:bg-neutral-600 checked:border-neutral-600"
                      />
                      <span className="absolute text-neutral-900 opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                      </span>
                    </label>
                    <span className={\`flex-1 text-sm \${todo.completed ? 'line-through text-neutral-500' : 'text-neutral-200'}\`}>
                      {todo.text}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteTodo(todo)}
                    className="text-neutral-500 hover:text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Delete todo"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
          
          <form onSubmit={handleAddTodo} className="flex gap-2 mt-2">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="+ Add a new todo..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddTodo(e);
                }
              }}
              disabled={!isConnected || !user}
              className="flex-1 px-4 py-2 bg-transparent border border-neutral-800 text-neutral-100 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-600 focus:border-transparent placeholder-neutral-500"
            />
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

  return (
    <ExampleLayout
      appJsCode={appJsCode}
      files={todoFiles}
      title="Todo List"
      description="A collaborative task management application where multiple users can create, complete, and delete todos in real-time. This example demonstrates synchronized state management with optimistic UI updates, presence awareness showing who's online, and real-time broadcasting of task changes. Perfect for team collaboration, project management, or learning how to build shared productivity tools."
    />
  )
}
