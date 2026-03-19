'use client'

import { ExampleLayoutProps } from '../example-layout'

const appJsCode = `import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { AutoSizer, Table, Column, InfiniteLoader } from 'react-virtualized';
import 'react-virtualized/styles.css';

// Initialize Supabase client
const supabaseUrl = '${process.env.NEXT_PUBLIC_EXAMPLES_SUPABASE_URL}';
const supabaseKey = '${process.env.NEXT_PUBLIC_EXAMPLES_SUPABASE_ANON_KEY}';
const supabase = createClient(supabaseUrl, supabaseKey);

// Constants
const PAGE_SIZE = 50;
const TABLE_NAME = 'logging_data';

// Log level colors
const LOG_LEVEL_COLORS = {
  ERROR: 'bg-red-800',
  WARN: 'bg-amber-800',
  INFO: 'bg-green-800',
  DEBUG: 'bg-blue-800'
};

export default function App() {
  // Instance ID for channel
  const instanceId = useRef(Math.random().toString(36).substring(2, 9)).current;
  
  // Log viewer state
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAtTop, setIsAtTop] = useState(true);
  const [logCountAtScroll, setLogCountAtScroll] = useState(0);
  
  // Refs
  const tableRef = useRef(null);
  const gridRef = useRef(null);
  const newLogsRef = useRef([]);

  // Function to load rows from Supabase
  const loadMoreRows = async ({ startIndex, stopIndex }) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log(\`Loading rows from \${startIndex} to \${stopIndex}\`);

      // Calculate the range for the query
      const from = startIndex;
      const to = stopIndex;

      // Query Supabase for the range of rows
      const { data, error, count } = await supabase
        .from(TABLE_NAME)
        .select('*', { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Update total count if we got it
      if (count !== null) {
        setTotalCount(count);
      }

      // Update logs with the fetched data
      setLogs(prevLogs => {
        // Create a new array with the same length as before
        const newLogs = [...prevLogs];
        
        // Insert the fetched logs at their correct positions
        data.forEach((log, index) => {
          newLogs[startIndex + index] = log;
        });
        
        return newLogs;
      });

      return data;
    } catch (err) {
      console.error('Error loading logs:', err);
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Function to determine if a row is loaded
  const isRowLoaded = ({ index }) => {
    return Boolean(logs[index]);
  };

  // Cell data getters
  const cellDataGetter = ({ dataKey, rowData }) => {
    return rowData ? rowData[dataKey] : null;
  };

  // Cell renderers
  const idCellRenderer = ({ cellData }) => {
    return <div className="p-2 overflow-hidden text-ellipsis whitespace-nowrap text-neutral-300">#{cellData || ''}</div>;
  };

  const messageCellRenderer = ({ cellData }) => {
    return (
      <div className="p-2 overflow-hidden whitespace-pre-wrap text-neutral-300 leading-relaxed">
        {cellData || ''}
      </div>
    );
  };

  const levelCellRenderer = ({ cellData }) => {
    if (!cellData) return <div className="p-2"></div>;
    
    const level = cellData;
    const colorClass = LOG_LEVEL_COLORS[level] || 'bg-neutral-700';
    
    return (
      <div 
        className={\`p-2 inline-block rounded px-2 py-1 font-medium text-neutral-100/50 text-center min-w-[60px] text-white \${colorClass}\`}
      >
        {level}
      </div>
    );
  };

  const timestampCellRenderer = ({ cellData }) => {
    if (!cellData) return <div className="p-2"></div>;
    
    const date = new Date(cellData);
    const formatted = date.toLocaleString();
    
    return <div className="p-2 text-neutral-400">{formatted}</div>;
  };

  // Header renderer for all columns
  const headerRenderer = ({ label }) => {
    return <div className="font-medium p-2">{label}</div>;
  };

  // Function to scroll to top
  const scrollToTop = () => {
    if (gridRef.current) {
      gridRef.current.scrollToPosition({ scrollTop: 0 });
      
      // Apply new logs to the main logs array
      if (newLogsRef.current.length > 0) {
        setLogs(prevLogs => {
          // Create a new array with new logs at the beginning
          const updatedLogs = [...newLogsRef.current, ...prevLogs];
          // Reset new logs reference
          newLogsRef.current = [];
          return updatedLogs;
        });
        
        // Update total count
        setTotalCount(prev => prev + newLogsRef.current.length);
      }
      
      setIsAtTop(true);
      setLogCountAtScroll(0); // Reset the log count at scroll
    }
  };

  // Handle scroll events to detect if at top and capture log count
  const handleScroll = ({ scrollTop }) => {
    const wasAtTop = isAtTop;
    setIsAtTop(scrollTop === 0);
    
    // If we just started scrolling, capture the current log count
    if (wasAtTop && scrollTop > 0) {
      setLogCountAtScroll(totalCount);
    }
    
    // If scrolled back to top, apply new logs and reset counter
    if (scrollTop === 0 && newLogsRef.current.length > 0) {
      // Apply new logs to the main logs array
      setLogs(prevLogs => {
        // Create a new array with new logs at the beginning
        const updatedLogs = [...newLogsRef.current, ...prevLogs];
        // Reset new logs reference
        newLogsRef.current = [];
        return updatedLogs;
      });
      
      // Update total count
      setTotalCount(prev => prev + newLogsRef.current.length);
      setLogCountAtScroll(0); // Reset the log count at scroll
    }
  };

  // Load initial data when component mounts
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log('Loading initial log data');
        setIsLoading(true);
        setError(null);

        // Query Supabase for the first page of logs
        const { data, error, count } = await supabase
          .from(TABLE_NAME)
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .limit(PAGE_SIZE);

        if (error) throw error;

        console.log(\`Loaded \${data?.length || 0} initial logs, total count: \${count}\`);

        // Update total count if we got it
        if (count !== null) {
          setTotalCount(count);
        }

        // Set the initial logs
        setLogs(data || []);
      } catch (err) {
        console.error('Error loading initial logs:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    // Set up the channel for real-time updates
    const channel = supabase
      .channel('logs', { config: { private: true } })
      .on('broadcast', { event: 'INSERT' }, (payload) => {
        console.log('New log entry received:', payload);
        
        // If we're at the top, add the new log to the beginning of the list
        if (isAtTop) {
          setLogs(prevLogs => [payload.payload.record, ...prevLogs]);
          setTotalCount(prev => prev + 1);
        } else {
          // Otherwise, store it in the newLogsRef and increment the counter
          newLogsRef.current = [payload.payload.record, ...newLogsRef.current];
          setTotalCount(prev => prev + 1);
        }
      })
      .subscribe(status => console.log("status:", status));
    
    console.log('Real-time subscription set up successfully');

    return () => {
      console.log('Cleaning up real-time subscription');
      channel.unsubscribe();
    };
  }, []); // Only run once on mount

  // Add a separate effect to handle isAtTop changes
  useEffect(() => {
    console.log('isAtTop changed:', isAtTop);
    
    // If we're back at the top and have new logs, apply them
    if (isAtTop && newLogsRef.current.length > 0) {
      console.log('Applying new logs at top:', newLogsRef.current.length);
      
      setLogs(prevLogs => {
        // Create a new array with new logs at the beginning
        const updatedLogs = [...newLogsRef.current, ...prevLogs];
        // Reset new logs reference
        newLogsRef.current = [];
        return updatedLogs;
      });
      
      // Update total count and reset counter
      setTotalCount(prev => prev + newLogsRef.current.length);
      setLogCountAtScroll(0); // Reset the log count at scroll
    }
  }, [isAtTop]);

  // Save grid reference when table is rendered
  const onTableRendered = useCallback(({ registerChild }) => {
    return (ref) => {
      registerChild(ref);
      tableRef.current = ref;
      
      // Get the Grid component from the Table
      if (ref) {
        gridRef.current = ref.Grid;
      }
    };
  }, []);

  // Calculate if we should show the new logs notification
  const shouldShowNotification = !isAtTop && logCountAtScroll > 0 && totalCount > logCountAtScroll;

  return (
    <div className="text-sm flex flex-col h-screen bg-neutral-900 text-white relative antialiased">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-neutral-800">
        <h1 className="font-medium">Log Viewer</h1>
        <div className="flex gap-4 items-center">
          {isLoading && <span className="text-neutral-400">Loading...</span>}
          <span className="text-neutral-500">Total Logs: {totalCount}</span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-500 text-white m-4 rounded">
          Error: {error}
        </div>
      )}

      {/* New logs badge */}
      {shouldShowNotification && (
        <div 
          className="text-xs fixed top-24 left-1/2 transform -translate-x-1/2 bg-neutral-700 text-white px-4 py-2 rounded-full font-medium shadow-lg cursor-pointer z-50 hover:bg-neutral-600 flex items-center justify-center"
          onClick={scrollToTop}
        >
          {totalCount - logCountAtScroll} new log{totalCount - logCountAtScroll === 1 ? '' : 's'}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 font-mono text-xs">
        <div className="h-full relative">
          <div className="h-32 w-full z-10 absolute left-0 right-0 bottom-0 bg-gradient-to-t from-neutral-900 to-transparent" />
          <AutoSizer>
            {({ width, height }) => (
              <InfiniteLoader
                isRowLoaded={isRowLoaded}
                loadMoreRows={loadMoreRows}
                rowCount={totalCount}
                minimumBatchSize={PAGE_SIZE}
                threshold={20}
              >
                {({ onRowsRendered, registerChild }) => (
                  <Table
                    ref={onTableRendered({ registerChild })}
                    width={width}
                    height={height}
                    headerHeight={40}
                    rowHeight={48}
                    rowCount={totalCount}
                    rowGetter={({ index }) => logs[index] || {}}
                    onRowsRendered={onRowsRendered}
                    onScroll={handleScroll}
                    overscanRowCount={10}
                    className="w-full"
                    headerClassName="text-xs uppercase text-neutral-500"
                    gridClassName="w-full"
                    rowClassName="border-b border-neutral-800 hover:bg-neutral-800 w-full"
                  >
                    <Column
                      label="ID"
                      dataKey="id"
                      width={100}
                      cellDataGetter={cellDataGetter}
                      cellRenderer={idCellRenderer}
                      headerRenderer={headerRenderer}
                    />
                    <Column
                      label="Message"
                      dataKey="log_message"
                      flexGrow={1}
                      width={400}
                      cellDataGetter={cellDataGetter}
                      cellRenderer={messageCellRenderer}
                      headerRenderer={headerRenderer}
                    />
                    <Column
                      label="Level"
                      dataKey="log_level"
                      cellDataGetter={cellDataGetter}
                      cellRenderer={levelCellRenderer}
                      headerRenderer={headerRenderer}
                    />
                    <Column
                      label="Timestamp"
                      dataKey="created_at"
                      cellDataGetter={cellDataGetter}
                      cellRenderer={timestampCellRenderer}
                      headerRenderer={headerRenderer}
                    />
                  </Table>
                )}
              </InfiniteLoader>
            )}
          </AutoSizer>
        </div>
      </div>
    </div>
  );
}`

const logViewerFiles = {
  '/App.js': appJsCode,
  '/styles.css': `/* No custom CSS needed - using Tailwind */`,
}

const layoutProps: ExampleLayoutProps = {
  appJsCode,
  files: logViewerFiles,
  dependencies: {
    'react-virtualized': 'latest',
  },
  title: 'Log Viewer',
  description:
    "A real-time log viewer that uses Supabase Realtime's broadcast channel to stream and display log entries as they occur across multiple instances.",
}

export default layoutProps
