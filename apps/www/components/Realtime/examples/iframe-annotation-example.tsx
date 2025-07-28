'use client'

import { ExampleLayoutProps } from '../example-layout'

const instanceId = Math.random().toString(36).substring(2, 9)

const appJsCode = `import { useEffect, useState, useRef } from 'react';
import './styles.css';
import { createClient } from '@supabase/supabase-js';
import { X } from 'lucide-react';

// Initialize Supabase client
const supabaseUrl = '${process.env.NEXT_PUBLIC_EXAMPLES_SUPABASE_URL}';
const supabaseKey = '${process.env.NEXT_PUBLIC_EXAMPLES_SUPABASE_ANON_KEY}';
const supabase = createClient(supabaseUrl, supabaseKey);

// Channel name - using a unique ID to ensure both instances connect to the same channel
const CHANNEL = 'image-annotation-example-${instanceId}';

export default function App() {
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentPosition, setCommentPosition] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const userId = useRef(Math.random().toString(36).substring(2, 15));
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const channelRef = useRef(null);
  
  // Specific Unsplash image URL
  const imageUrl = "https://images.unsplash.com/photo-1600695580162-cb0fa319067a?q=80&w=3764&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
  
  // Initialize connection
  useEffect(() => {
    // Generate a random username
    const adjectives = ['Happy', 'Clever', 'Brave', 'Bright', 'Kind'];
    const nouns = ['Panda', 'Tiger', 'Eagle', 'Dolphin', 'Fox'];
    const randomName = \`\${adjectives[Math.floor(Math.random() * adjectives.length)]}\${
      nouns[Math.floor(Math.random() * nouns.length)]
    }\${Math.floor(Math.random() * 100)}\`;
    setUsername(randomName);
    
    // Set up Supabase channel
    const channel = supabase.channel(CHANNEL);
    channelRef.current = channel;
    
    // Handle presence for user list
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const presenceList = [];
      
      // Convert presence state to array
      Object.keys(state).forEach(key => {
        const presences = state[key];
        presenceList.push(...presences);
      });
      
      setActiveUsers(presenceList);
    });
    
    // Handle new comments
    channel.on('broadcast', { event: 'new_comment' }, (payload) => {
      const newComment = payload.payload;
      
      setComments(prevComments => {
        // Check if comment already exists (avoid duplicates)
        const exists = prevComments.some(comment => comment.id === newComment.id);
        if (exists) return prevComments;
        
        return [...prevComments, newComment];
      });
    });
    
    // Handle comment deletion
    channel.on('broadcast', { event: 'delete_comment' }, (payload) => {
      const { commentId } = payload.payload;
      
      setComments(prevComments => 
        prevComments.filter(comment => comment.id !== commentId)
      );
    });
    
    // Subscribe to channel
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track presence
        await channel.track({
          user_id: userId.current,
          username: randomName,
          online_at: new Date().getTime(),
        });
        
        setIsConnected(true);
      }
    });
    
    // Clean up
    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, []);
  
  // Handle image load
  const handleImageLoad = () => {
    setImageLoaded(true);
  };
  
  // Handle click on the image
  const handleImageClick = (e) => {
    if (!isConnected || !imageRef.current) return;
    
    // Don't process clicks on existing comments or the input form
    if (
      e.target.closest('[data-comment]') || 
      e.target.closest('[data-comment-bubble]') || 
      e.target.closest('[data-comment-input]')
    ) {
      return;
    }
    
    // Calculate relative position (%)
    const rect = imageRef.current.getBoundingClientRect();
    
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Set position for new comment
    setCommentPosition({ 
      x: xPercent, 
      y: yPercent
    });
    
    // Focus on input (will be created in render)
    setTimeout(() => {
      const input = document.getElementById('new-comment-input');
      if (input) input.focus();
    }, 10);
  };
  
  // Handle comment submission
  const handleCommentSubmit = (e) => {
    e.preventDefault();
    
    if (!newComment.trim() || !commentPosition || !isConnected) {
      // Reset state if invalid
      setCommentPosition(null);
      setNewComment('');
      return;
    }
    
    // Create new comment
    const comment = {
      id: \`\${userId.current}-\${Date.now()}\`,
      text: newComment.trim(),
      position: commentPosition,
      user_id: userId.current,
      username,
      created_at: Date.now(),
    };
    
    // Add to local state
    setComments(prevComments => [...prevComments, comment]);
    
    // Broadcast to other clients
    channelRef.current.send({
      type: 'broadcast',
      event: 'new_comment',
      payload: comment,
    });
    
    // Reset state
    setCommentPosition(null);
    setNewComment('');
  };
  
  // Handle comment deletion
  const handleDeleteComment = (commentId) => {
    // Remove from local state
    setComments(prevComments => 
      prevComments.filter(comment => comment.id !== commentId)
    );
    
    // Broadcast deletion
    channelRef.current.send({
      type: 'broadcast',
      event: 'delete_comment',
      payload: { commentId },
    });
  };
  
  // Cancel new comment
  const handleCancelComment = () => {
    setCommentPosition(null);
    setNewComment('');
  };
  
  // Handle input change
  const handleInputChange = (e) => {
    setNewComment(e.target.value);
  };
  
  // Handle keydown in input
  const handleInputKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleCancelComment();
    }
  };
  
  return (
    <div className="flex flex-col h-screen bg-neutral-800 text-white antialiased">
      <div className="flex gap-2 flex-wrap absolute top-4 right-4 z-10">
          {activeUsers.map((user) => (
            <div 
              key={user.user_id} 
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 text-neutral-300 text-xs"
            >
              <div className="w-1 h-1 rounded-full bg-green-400"></div>
              <span>{user.username}</span>
            </div>
          ))}
        </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-6xl mx-auto h-full">
          <div className="relative h-full bg-neutral-800 overflow-hidden" ref={containerRef}>
            {/* Loading indicator */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/80 z-10">
                <div className="w-10 h-10 border-4 border-neutral-700 border-t-neutral-200 rounded-full animate-spin mb-2"></div>
                <p className="text-neutral-400 text-sm">Loading image...</p>
              </div>
            )}
            
            {/* The image to annotate */}
            <img 
              ref={imageRef}
              src={imageUrl} 
              alt="Annotatable image"
              className="w-full h-full object-cover cursor-crosshair"
              onClick={handleImageClick}
              onLoad={handleImageLoad}
            />
            
            {/* Comments overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {comments.map((comment) => (
                <div 
                  key={comment.id} 
                  data-comment
                  className="absolute pointer-events-auto"
                  style={{
                    left: \`\${comment.position.x}%\`,
                    top: \`\${comment.position.y}%\`,
                    transform: 'translate(-50%, -100%)',
                  }}
                >
                  <div 
                    data-comment-bubble
                    className="max-w-[400px] min-w-32 bg-neutral-800 rounded shadow p-3 pt-2 mb-2"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-neutral-400">{comment.username}</span>
                      <button 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-neutral-800 text-neutral-500 hover:text-red-400"
                        aria-label="Delete comment"
                      >
                        <X strokeWidth={1.5} size={14} />
                      </button>
                    </div>
                    <div className="text-xs  text-neutral-200 break-words">{comment.text}</div>
                  </div>
                  <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-neutral-900/90 mx-auto"></div>
                </div>
              ))}
              
              {/* New comment input */}
              {commentPosition && (
                <div 
                  data-comment
                  className="absolute pointer-events-auto"
                  style={{
                    left: \`\${commentPosition.x}%\`,
                    top: \`\${commentPosition.y}%\`,
                    transform: 'translate(-50%, -100%)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div 
                    data-comment-bubble
                    className="bg-neutral-800 rounded shadow p-2 mb-2 w-64"
                  >
                    <form onSubmit={handleCommentSubmit}>
                      <input
                        id="new-comment-input"
                        type="text"
                        value={newComment}
                        onChange={handleInputChange}
                        onKeyDown={handleInputKeyDown}
                        placeholder="Type your comment..."
                        data-comment-input
                        className="w-full px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-200 placeholder-neutral-500 mb-2"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button 
                          type="button" 
                          onClick={handleCancelComment}
                          className="px-3 py-1 text-xs bg-neutral-800 text-neutral-300 rounded hover:bg-neutral-700"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="px-3 py-1 text-xs bg-neutral-300 text-neutral-900 rounded hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!newComment.trim()}
                        >
                          Add
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`

const imageAnnotationFiles = {
  '/App.js': appJsCode,
  '/styles.css': `/* No custom CSS needed - using Tailwind */`,
}

const layoutProps: ExampleLayoutProps = {
  appJsCode,
  files: imageAnnotationFiles,
  title: 'IFrame Annotation',
  description:
    "A collaborative annotation tool that uses Supabase Realtime's broadcast channel to synchronize annotations and comments on embedded web content across multiple users.",
}

export default layoutProps
