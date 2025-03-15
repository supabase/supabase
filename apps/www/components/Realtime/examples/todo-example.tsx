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

// Channel name - using a unique ID to ensure both instances connect to the same channel
const CHANNEL = 'todo-example-${instanceId}';

export default function App() {
  const [todos, setTodos] = useState([
    {
      id: '1',
      text: 'Review project requirements',
      completed: false,
      created_by: 'system'
    },
    {
      id: '2',
      text: 'Set up development environment',
      completed: true,
      created_by: 'system'
    },
    {
      id: '3',
      text: 'Create basic UI components',
      completed: false,
      created_by: 'system'
    },
    {
      id: '4',
      text: 'Implement real-time sync',
      completed: false,
      created_by: 'system'
    },
    {
      id: '5',
      text: 'Write documentation',
      completed: false,
      created_by: 'system'
    }
  ]);
  const [newTodo, setNewTodo] = useState('');
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const userId = useState(() => Math.random().toString(36).substring(2, 15))[0];

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
      .on('broadcast', { event: 'todo_action' }, (payload) => {
        const action = payload.payload;
        
        switch (action.type) {
          case 'add':
            setTodos((prev) => [...prev, action.todo]);
            break;
          case 'toggle':
            setTodos((prev) =>
              prev.map((todo) =>
                todo.id === action.todo.id
                  ? { ...todo, completed: action.todo.completed }
                  : todo
              )
            );
            break;
          case 'delete':
            setTodos((prev) => prev.filter((todo) => todo.id !== action.todo.id));
            break;
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track presence
          await channel.track({
            user_id: userId,
            username: randomName,
            online_at: new Date().getTime(),
          });
          setIsConnected(true);
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const handleAddTodo = (e) => {
    e.preventDefault();
    if (!newTodo.trim() || !isConnected) return;

    const todo = {
      id: Math.random().toString(36).substring(2, 15),
      text: newTodo.trim(),
      completed: false,
      created_by: userId,
    };

    // Broadcast the add action
    supabase.channel(CHANNEL).send({
      type: 'broadcast',
      event: 'todo_action',
      payload: { type: 'add', todo },
    });

    setNewTodo('');
  };

  const handleToggleTodo = (todo) => {
    if (!isConnected) return;

    const updatedTodo = { ...todo, completed: !todo.completed };

    // Broadcast the toggle action
    supabase.channel(CHANNEL).send({
      type: 'broadcast',
      event: 'todo_action',
      payload: { type: 'toggle', todo: updatedTodo },
    });
  };

  const handleDeleteTodo = (todo) => {
    if (!isConnected) return;

    // Broadcast the delete action
    supabase.channel(CHANNEL).send({
      type: 'broadcast',
      event: 'todo_action',
      payload: { type: 'delete', todo },
    });
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-900 text-white antialiased">
      {/* Header */}
      <div className="flex justify-between items-center px-5 pt-3">
        <h1 className="font-medium text-sm text-neutral-400">{todos.filter((todo) => !todo.completed).length} todos to complete</h1>
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
            {todos.length === 0 ? (
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
              disabled={!isConnected}
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
      title="Todo Example"
      description="A collaborative task management application where multiple users can create, complete, and delete todos in real-time. This example demonstrates synchronized state management with optimistic UI updates, presence awareness showing who's online, and real-time broadcasting of task changes. Perfect for team collaboration, project management, or learning how to build shared productivity tools."
    />
  )
}
