'use client'

import type { ExampleLayoutProps } from '../example-layout'

const instanceId = Math.random().toString(36).substring(2, 9)

const appJsCode = `import { useEffect, useState, useRef } from 'react';
import './styles.css';
import { createClient } from '@supabase/supabase-js';
import * as Y from 'yjs';
import Quill from 'quill';
import 'quill/dist/quill.bubble.css'; // Using bubble theme without toolbar

// Initialize Supabase client
const supabaseUrl = '${process.env.NEXT_PUBLIC_EXAMPLES_SUPABASE_URL}';
const supabaseKey = '${process.env.NEXT_PUBLIC_EXAMPLES_SUPABASE_ANON_KEY}';
const supabase = createClient(supabaseUrl, supabaseKey);

// Channel name - using a unique ID to ensure both instances connect to the same channel
const CHANNEL = 'editor-example-${instanceId}';

export default function App() {
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const ydocRef = useRef(null);
  const channelRef = useRef(null);
  const isLocalChangeRef = useRef(false);

  useEffect(() => {
    // Generate a random username
    const adjectives = ['Happy', 'Clever', 'Brave', 'Bright', 'Kind'];
    const nouns = ['Panda', 'Tiger', 'Eagle', 'Dolphin', 'Fox'];
    const randomName = \`\${adjectives[Math.floor(Math.random() * adjectives.length)]}\${
      nouns[Math.floor(Math.random() * nouns.length)]
    }\${Math.floor(Math.random() * 100)}\`;
    setUsername(randomName);
    
    // Wait for the editor element to be available
    if (!editorRef.current) return;
    
    // Initialize Quill without toolbar
    const quill = new Quill(editorRef.current, {
      placeholder: 'Start typing to collaborate...',
      theme: 'bubble', // Using bubble theme which has no toolbar
      formats: [], // Disable all formatting
      modules: {
        clipboard: true,
        toolbar: false
      }
    });
    
    // Apply dark theme styles to Quill editor
    editorRef.current.style.color = 'rgb(229, 229, 229)'; // text-neutral-200
    const editor = editorRef.current.querySelector('.ql-editor');
    if (editor) {
      editor.style.cssText = \`
        height: 100%;
        font-size: 16px;
        padding: 1rem;
        font-family: 'Inter', sans-serif;
      \`;
    }
    
    // Set initial empty content
    quill.setText('');
    
    quillRef.current = quill;
    
    // Create a YJS document
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    
    // Create a shared text type
    const ytext = ydoc.getText('quill');
    
    // Set up Supabase channel
    const channel = supabase.channel(CHANNEL);
    channelRef.current = channel;
    
    // Handle presence for user list
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const users = [];
      
      Object.keys(state).forEach(key => {
        const presences = state[key];
        users.push(...presences);
      });
      
      setActiveUsers(users);
    });
    
    // Handle document updates
    channel.on('broadcast', { event: 'document-update' }, (payload) => {
      // Skip if this is our own update
      if (payload.payload.sender === ydoc.clientID) return;
      
      // Apply YJS update
      const update = new Uint8Array(Object.values(payload.payload.update));
      
      // Set flag to prevent echo
      isLocalChangeRef.current = true;
      
      // Apply update to YJS document
      Y.applyUpdate(ydoc, update);
      
      // Update Quill with the new content
      const newContent = ytext.toString();
      const currentContent = quill.getText();
      
      if (newContent !== currentContent) {
        quill.setText(newContent);
      }
      
      isLocalChangeRef.current = false;
    });
    
    // Subscribe to channel
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track presence
        await channel.track({
          user_id: ydoc.clientID,
          username: randomName,
          online_at: new Date().getTime()
        });
        
        setIsConnected(true);
      }
    });
    
    // Listen for Quill text changes
    quill.on('text-change', (delta, oldDelta, source) => {
      if (source !== 'user' || isLocalChangeRef.current) return;
      
      // Update YJS document
      ytext.delete(0, ytext.length);
      ytext.insert(0, quill.getText());
      
      // Broadcast update
      const update = Y.encodeStateAsUpdate(ydoc);
      
      // Convert to object for JSON serialization
      const updateObj = {};
      update.forEach((value, index) => {
        updateObj[index] = value;
      });
      
      // Send update via Supabase
      channel.send({
        type: 'broadcast',
        event: 'document-update',
        payload: {
          update: updateObj,
          sender: ydoc.clientID
        }
      });
    });
    
    // Clean up
    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-neutral-900 text-white antialiased">
      {/* Header */}
      <div className="flex gap-2 flex-wrap absolute top-4 right-4">
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
      <div className="flex-1 overflow-hidden p-12">
        <div className="max-w-4xl mx-auto h-full">
          <div className="h-full text-neutral-200 overflow-hidden">
            <div ref={editorRef} className="h-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}`

const editorFiles = {
  '/App.js': appJsCode,
  '/styles.css': `/* No custom CSS needed - using Tailwind */

/* Override Quill styles for dark theme */
.ql-editor.ql-blank::before {
  color: rgb(115, 115, 115) !important;
  font-style: normal !important;
  content: attr(data-placeholder) !important;
  left: 1rem !important;
  right: 1rem !important;
  pointer-events: none !important;
}

.ql-bubble {
  border: none !important;
}

.ql-editor {
  caret-color: rgb(229, 229, 229) !important;
}

.ql-editor p {
  color: rgb(200, 200, 200) !important;
  line-height: 1.6 !important;
  font-family: 'Inter', sans-serif !important;
}`,
}

const layoutProps: ExampleLayoutProps = {
  appJsCode,
  files: editorFiles,
  dependencies: {
    yjs: 'latest',
    quill: 'latest',
  },
  title: 'Collaborative Editor',
  description:
    "A real-time collaborative text editor that uses Supabase Realtime's broadcast channel to sync document changes between users via YJS CRDT.",
}

export default layoutProps
