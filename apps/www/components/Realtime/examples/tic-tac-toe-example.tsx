'use client'

import { ExampleLayoutProps } from '../example-layout'

const instanceId = Math.random().toString(36).substring(2, 9)

const appJsCode = `import { useEffect, useState, useRef } from 'react';
import './styles.css';
import { createClient } from '@supabase/supabase-js';
import { X, Circle } from 'lucide-react';

// Initialize Supabase client
const supabaseUrl = '${process.env.NEXT_PUBLIC_EXAMPLES_SUPABASE_URL}';
const supabaseKey = '${process.env.NEXT_PUBLIC_EXAMPLES_SUPABASE_ANON_KEY}';
const supabase = createClient(supabaseUrl, supabaseKey);

// Channel name - using a unique ID to ensure both instances connect to the same channel
const CHANNEL = 'tictactoe-example-${instanceId}';

export default function App() {
  // Game state
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null);
  
  // Player state
  const [playerSymbol, setPlayerSymbol] = useState(null);
  const [players, setPlayers] = useState([]);
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  // Refs
  const userId = useRef(Math.random().toString(36).substring(2, 15));
  const channelRef = useRef(null);
  
  // Initialize game
  useEffect(() => {
    console.log('Initializing game...');
    
    // Generate random username
    const adjectives = ['Happy', 'Clever', 'Brave', 'Bright', 'Kind'];
    const nouns = ['Panda', 'Tiger', 'Eagle', 'Dolphin', 'Fox'];
    const randomName = \`\${adjectives[Math.floor(Math.random() * adjectives.length)]}\${
      nouns[Math.floor(Math.random() * nouns.length)]
    }\${Math.floor(Math.random() * 100)}\`;
    setUsername(randomName);
    
    // Create and subscribe to channel
    const channel = supabase.channel(CHANNEL, {
      config: {
        presence: {
          key: userId.current,
        },
      },
    });
    
    channelRef.current = channel;
    
    // Handle presence changes
    channel.on('presence', { event: 'sync' }, () => {
      console.log('Presence sync event received');
      
      // Get current state of presence
      const state = channel.presenceState();
      console.log('Presence state:', state);
      
      // Convert to array of players
      const currentPlayers = [];
      Object.keys(state).forEach(key => {
        const presences = state[key];
        currentPlayers.push(...presences);
      });
      
      // Sort by join time
      currentPlayers.sort((a, b) => a.joined_at - b.joined_at);
      console.log('Current players:', currentPlayers);
      
      setPlayers(currentPlayers);
      
      // Assign symbols based on join order
      if (currentPlayers.length > 0) {
        if (currentPlayers[0].userId === userId.current) {
          console.log('You are player X');
          setPlayerSymbol('X');
        } else if (currentPlayers.length > 1 && currentPlayers[1].userId === userId.current) {
          console.log('You are player O');
          setPlayerSymbol('O');
        } else {
          console.log('You are a spectator');
          setPlayerSymbol(null);
        }
      }
    });
    
    // Handle game state updates
    channel.on('broadcast', { event: 'game_update' }, (payload) => {
      console.log('Game update received:', payload.payload);
      const { board: newBoard, isXNext: newIsXNext, winner: newWinner } = payload.payload;
      
      setBoard(newBoard);
      setIsXNext(newIsXNext);
      setWinner(newWinner);
    });
    
    // Handle game reset
    channel.on('broadcast', { event: 'game_reset' }, () => {
      console.log('Game reset received');
      setBoard(Array(9).fill(null));
      setIsXNext(true);
      setWinner(null);
    });
    
    // Subscribe to channel
    channel.subscribe(async (status) => {
      console.log('Channel status:', status);
      
      if (status === 'SUBSCRIBED') {
        // Track presence
        await channel.track({
          userId: userId.current,
          username: randomName,
          joined_at: new Date().getTime()
        });
        
        setIsConnected(true);
        console.log('Connected to channel');
      }
    });
    
    // Cleanup on unmount
    return () => {
      console.log('Cleaning up...');
      channel.unsubscribe();
    };
  }, []);
  
  // Handle square click
  const handleClick = (index) => {
    // Don't allow moves if:
    // - Not connected
    // - Square already filled
    // - Not player's turn
    // - Game already has a winner
    if (
      !isConnected ||
      board[index] ||
      (isXNext && playerSymbol !== 'X') ||
      (!isXNext && playerSymbol !== 'O') ||
      winner
    ) {
      return;
    }
    
    console.log('Handling click on square', index);
    
    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    
    // Check for winner
    const newWinner = calculateWinner(newBoard);
    
    // Update local state immediately
    setBoard(newBoard);
    setIsXNext(!isXNext);
    
    if (newWinner) {
      setWinner(newWinner);
    }
    
    // Broadcast move
    channelRef.current.send({
      type: 'broadcast',
      event: 'game_update',
      payload: {
        board: newBoard,
        isXNext: !isXNext,
        winner: newWinner
      }
    });
    
    console.log('Move broadcast sent');
  };
  
  // Reset game
  const resetGame = () => {
    console.log('Resetting game...');
    
    // Reset local state
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    
    // Broadcast reset
    channelRef.current.send({
      type: 'broadcast',
      event: 'game_reset',
      payload: {}
    });
    
    console.log('Reset broadcast sent');
  };
  
  // Calculate winner
  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6]
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    
    return null;
  };
  
  // Get game status message
  const getStatusMessage = () => {
    if (winner) {
      return \`Winner: \${winner}\`;
    } else if (board.every(square => square !== null)) {
      return 'Draw!';
    } else if (players.length < 2) {
      return 'Waiting for another player...';
    } else {
      return \`Next player: \${isXNext ? 'X' : 'O'}\${
        ((isXNext && playerSymbol === 'X') || (!isXNext && playerSymbol === 'O')) 
          ? ' (Your turn)' 
          : ''
      }\`;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-900 text-white antialiased">
      {/* Main content */}
      <div className="flex-1 overflow-hidden p-4 max-w-2xl mx-auto flex flex-col items-center justify-center">
        <div className="max-w-lg mx-auto flex flex-col items-center">
          {/* Players */}
          <div className="flex gap-2 mb-4 w-full">
            {players.map((player, index) => (
              <div 
                key={player.userId} 
                className={\`
                  flex flex-1 items-center justify-center gap-2 px-4 py-2 
                  \${(isXNext && index === 0) || (!isXNext && index === 1) 
                    ? 'bg-neutral-700' 
                    : 'bg-neutral-800'
                  } 
                  rounded-md w-full text-neutral-300 text-sm transition-all
                \`}
              >
                <span className="truncate">{player.userId === userId.current ? 'You' : player.username}</span>
                <span className={\`\${index === 0 ? 'text-blue-400' : 'text-red-400'}\`}>
                  {index === 0 ? (
                    <X className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </span>
              </div>
            ))}
          </div>
          
          {/* Game status - only show winner or draw */}
          {(winner || board.every(square => square !== null)) && (
            <div className="mb-6 text-neutral-300 text-lg font-medium">
              {winner ? \`Winner: \${winner}\` : 'Draw!'}
            </div>
          )}
          
          {/* Game board */}
          <div className="grid grid-cols-3 gap-2 overflow-hidden rounded-lg">
            {board.map((square, index) => (
              <button
                key={index}
                onClick={() => handleClick(index)}
                className={\`
                  w-20 h-20 flex items-center justify-center text-4xl font-bold
                  bg-neutral-800 hover:bg-neutral-700
                  border border-neutral-700
                  \${
                    ((isXNext && playerSymbol === 'X') || (!isXNext && playerSymbol === 'O')) &&
                    !square &&
                    !winner
                      ? 'cursor-pointer'
                      : 'cursor-not-allowed'
                  }
                  \${square === 'X' ? 'text-blue-400' : square === 'O' ? 'text-red-400' : 'text-neutral-700'}
                  \${index === 0 ? 'rounded-tl-lg' : ''}
                  \${index === 2 ? 'rounded-tr-lg' : ''}
                  \${index === 6 ? 'rounded-bl-lg' : ''}
                  \${index === 8 ? 'rounded-br-lg' : ''}
                \`}
                disabled={
                  !isConnected ||
                  !!square ||
                  (isXNext && playerSymbol !== 'X') ||
                  (!isXNext && playerSymbol !== 'O') ||
                  !!winner
                }
              >
                {square === 'X' ? (
                  <X className="w-12 h-12" />
                ) : square === 'O' ? (
                  <Circle className="w-12 h-12" />
                ) : null}
              </button>
            ))}
          </div>
          
          {/* Reset button */}
          <button
            onClick={resetGame}
            className="px-6 mt-4 w-full py-2 bg-neutral-800 hover:bg-neutral-600 text-neutral-100 rounded-md transition-colors"
          >
            Reset Game
          </button>
        </div>
      </div>
    </div>
  );
}`

const ticTacToeFiles = {
  '/App.js': appJsCode,
  '/styles.css': `/* No custom CSS needed - using Tailwind */`,
}

const layoutProps: ExampleLayoutProps = {
  appJsCode,
  files: ticTacToeFiles,
  title: 'Tic Tac Toe',
  description:
    "A multiplayer Tic Tac Toe game that uses Supabase Realtime's broadcast and presence features to synchronize game state and player turns between opponents.",
}

export default layoutProps
