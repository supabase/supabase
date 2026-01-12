'use client'

import { ExampleLayoutProps } from '../example-layout'

const instanceId = Math.random().toString(36).substring(2, 9)

const appJsCode = `import { useEffect, useState, useRef } from 'react';
import './styles.css';
import { createClient } from '@supabase/supabase-js';
import { Trash2 } from "lucide-react";

// Initialize Supabase client
const supabaseUrl = '${process.env.NEXT_PUBLIC_EXAMPLES_SUPABASE_URL}';
const supabaseKey = '${process.env.NEXT_PUBLIC_EXAMPLES_SUPABASE_ANON_KEY}';
const supabase = createClient(supabaseUrl, supabaseKey);

// Channel name - using a unique ID to ensure both instances connect to the same channel
const CHANNEL = 'whiteboard-example-${instanceId}';

export default function App() {
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#3ecf8e');
  
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const userId = useRef(Math.random().toString(36).substring(2, 15));
  const isInitialSetup = useRef(true);
  const pointsBuffer = useRef([]);
  const batchTimerRef = useRef(null);
  const channelRef = useRef(null);
  const currentPathRef = useRef([]);
  
  // Initialize canvas and context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas dimensions to match container
    const setupCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;

      // Get the actual dimensions of the container
      const { width, height } = container.getBoundingClientRect();
      
      // Set canvas dimensions to match container (with pixel density scaling)
      canvas.width = width * 2;
      canvas.height = height * 2;
      canvas.style.width = \`\${width}px\`;
      canvas.style.height = \`\${height}px\`;
      
      // Get and configure context
      const context = canvas.getContext('2d');
      context.scale(2, 2);
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.lineWidth = 5;
      context.strokeStyle = currentColor;
      contextRef.current = context;
      
      // Only clear canvas on initial setup
      if (isInitialSetup.current) {
        context.fillStyle = 'rgba(0,0,0,0)'; // bg-neutral-900
        context.fillRect(0, 0, canvas.width, canvas.height);
        isInitialSetup.current = false;
      }
    };
    
    // Initial setup
    setupCanvas();
    
    // Create ResizeObserver to handle container size changes
    const resizeObserver = new ResizeObserver(() => {
      setupCanvas();
    });
    
    // Observe the container element
    const container = canvas.parentElement;
    if (container) {
      resizeObserver.observe(container);
    }
    
    // Handle window resize as well
    window.addEventListener('resize', setupCanvas);
    
    return () => {
      // Clean up observers and event listeners
      resizeObserver.disconnect();
      window.removeEventListener('resize', setupCanvas);
      // Clear any pending batch timer
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current);
      }
    };
  }, []);
  
  // Update stroke color when currentColor changes
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = currentColor;
    }
  }, [currentColor]);
  
  // Function to send batched points
  const sendBatchedPoints = () => {
    if (pointsBuffer.current.length === 0) return;
    
    // Send the batch of points
    channelRef.current.send({
      type: 'broadcast',
      event: 'draw_batch',
      payload: {
        userId: userId.current,
        points: [...pointsBuffer.current],
        color: currentColor
      }
    });
    
    // Clear the buffer
    pointsBuffer.current = [];
  };
  
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
    
    // Handle batched drawing events
    channel.on('broadcast', { event: 'draw_batch' }, (payload) => {
      if (payload.payload.userId === userId.current) return;
      
      const { points, color } = payload.payload;
      const context = contextRef.current;
      
      if (!context || points.length === 0) return;
      
      // Save current stroke style
      const currentStrokeStyle = context.strokeStyle;
      
      // Set stroke style for this drawing operation
      context.strokeStyle = color;
      
      let isNewPath = true;
      
      // Process each point based on its type
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        
        if (point.type === 'start' || isNewPath) {
          // Start a new path
          context.beginPath();
          context.moveTo(point.x, point.y);
          isNewPath = false;
        } else if (point.type === 'move') {
          // Continue the path
          context.lineTo(point.x, point.y);
          context.stroke();
        }
      }
      
      // Restore previous stroke style
      context.strokeStyle = currentStrokeStyle;
    });
    
    // Handle individual drawing events (legacy support)
    channel.on('broadcast', { event: 'draw' }, (payload) => {
      if (payload.payload.userId === userId.current) return;
      
      const { x, y, type, color } = payload.payload;
      const context = contextRef.current;
      
      if (!context) return;
      
      // Save current stroke style
      const currentStrokeStyle = context.strokeStyle;
      
      // Set stroke style for this drawing operation
      context.strokeStyle = color;
      
      if (type === 'start') {
        context.beginPath();
        context.moveTo(x, y);
      } else if (type === 'move') {
        context.lineTo(x, y);
        context.stroke();
      }
      
      // Restore previous stroke style
      context.strokeStyle = currentStrokeStyle;
    });
    
    // Handle clear canvas event
    channel.on('broadcast', { event: 'clear' }, () => {
      const canvas = canvasRef.current;
      const context = contextRef.current;
      
      if (!context || !canvas) return;
      
      context.clearRect(0, 0, canvas.width, canvas.height);
    });
    
    // Subscribe to channel
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track presence
        await channel.track({
          user_id: userId.current,
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
  
  // Drawing handlers
  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    
    // Start a new path in the canvas
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
    
    // Reset the current path
    currentPathRef.current = [{ type: 'start', x: offsetX, y: offsetY }];
    
    // Add to buffer for batched sending with type information
    pointsBuffer.current.push({ type: 'start', x: offsetX, y: offsetY });
    
    // Start the batch timer if not already started
    if (!batchTimerRef.current) {
      batchTimerRef.current = setInterval(sendBatchedPoints, 10); // Send every 10ms for more frequent updates
    }
    
    // For backward compatibility, also send individual start event
    channelRef.current.send({
      type: 'broadcast',
      event: 'draw',
      payload: {
        userId: userId.current,
        type: 'start',
        x: offsetX,
        y: offsetY,
        color: currentColor
      }
    });
  };
  
  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    
    const { offsetX, offsetY } = nativeEvent;
    
    // Draw on local canvas
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
    
    // Add to buffer for batched sending with type information
    pointsBuffer.current.push({ type: 'move', x: offsetX, y: offsetY });
    
    // For backward compatibility, also send individual move event
    // Send every point for maximum smoothness
    channelRef.current.send({
      type: 'broadcast',
      event: 'draw',
      payload: {
        userId: userId.current,
        type: 'move',
        x: offsetX,
        y: offsetY,
        color: currentColor
      }
    });
    
    // Add to current path
    currentPathRef.current.push({ type: 'move', x: offsetX, y: offsetY });
  };
  
  const stopDrawing = () => {
    contextRef.current.closePath();
    setIsDrawing(false);
    
    // Send any remaining points
    sendBatchedPoints();
    
    // Clear the batch timer
    if (batchTimerRef.current) {
      clearInterval(batchTimerRef.current);
      batchTimerRef.current = null;
    }
    
    // Reset current path
    currentPathRef.current = [];
  };
  
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    
    // Clear the entire canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Broadcast clear event
    channelRef.current.send({
      type: 'broadcast',
      event: 'clear',
      payload: {
        userId: userId.current
      }
    });
  };
  
  // Color selection
  const colors = ['#3ecf8e', '#f43f5e', '#60a5fa', '#a78bfa', '#ffffff'];
  
  const selectColor = (color) => {
    setCurrentColor(color);
  };
  
  return (
    <div className="flex flex-col h-screen bg-neutral-900 text-white antialiased">
      {/* Toolbar */}
      <div className="flex items-center gap-4 absolute top-4 right-4">
        <button 
          onClick={clearCanvas} 
          className="p-2 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-full transition-colors"
          title="Clear Canvas"
        >
          <Trash2 strokeWidth={1.5} size={16} />
        </button>
        <div className="flex gap-2">
          {colors.map((color) => (
            <div
              key={color}
              className={\`w-6 h-6 rounded-full cursor-pointer border-2 \${
                color === currentColor ? 'border-neutral-300' : 'border-transparent'
              } hover:scale-110 transition-transform\`}
              style={{ backgroundColor: color }}
              onClick={() => selectColor(color)}
            />
          ))}
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {activeUsers.map((user, index) => (
            <div 
              key={index} 
              className="flex items-center gap-2 w-8 h-8 rounded-full bg-neutral-800 text-neutral-200 text-sm font-medium"
              title={user.username}
            >
              <div className="w-full h-full rounded-full flex items-center justify-center text-xs">
                {user.username[0].toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 h-full overflow-hidden">
        <div className="w-full h-full">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="w-full h-full cursor-crosshair touch-none bg-neutral-900 shrink-0"
          />
        </div>
      </div>
    </div>
  );
}`

const whiteboardFiles = {
  '/App.js': appJsCode,
}

const layoutProps: ExampleLayoutProps = {
  appJsCode,
  files: whiteboardFiles,
  title: 'Whiteboard',
  description:
    "A collaborative whiteboard that uses Supabase Realtime's broadcast channel to synchronize drawing strokes and cursor positions between multiple users in real-time.",
}

export default layoutProps
