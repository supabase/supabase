import type { TraceData } from '../types/trace'

// Sample trace data for the trace viewer
export const sampleTraceData: TraceData = {
  spans: [
    // Main request
    {
      id: '1',
      name: 'GET /design-system',
      startTime: 0,
      endTime: 118.27,
      method: 'GET',
      icon: 'globe',
    },
    { id: '2', name: 'Resolve Route', startTime: 0.5, endTime: 112.25, icon: 'code' },

    // Authentication flow
    { id: '3', name: 'Auth Middleware', startTime: 2.5, endTime: 15.8, icon: 'lock' },
    { id: '4', name: 'Verify JWT', startTime: 3.2, endTime: 8.7, icon: 'lock' },
    { id: '5', name: 'Fetch User', startTime: 8.9, endTime: 15.5, icon: 'database' },

    // Database queries
    {
      id: '6',
      name: 'Database Query: components',
      startTime: 16.2,
      endTime: 28.5,
      icon: 'database',
    },
    { id: '7', name: 'SQL Execution', startTime: 17.0, endTime: 22.8, icon: 'database' },
    { id: '8', name: 'Result Processing', startTime: 23.0, endTime: 28.0, icon: 'cpu' },

    // API calls
    {
      id: '9',
      name: 'External API Call',
      startTime: 29.5,
      endTime: 45.2,
      status: 'error',
      icon: 'globe',
    },
    {
      id: '10',
      name: 'POST /api/data',
      startTime: 30.0,
      endTime: 44.8,
      status: 'error',
      method: 'POST',
      icon: 'globe',
    },
    { id: '11', name: 'Error Handling', startTime: 44.9, endTime: 45.1, icon: 'warning' },

    // Rendering
    { id: '12', name: 'Render Components', startTime: 46.0, endTime: 65.5, icon: 'code' },
    { id: '13', name: 'Fetch Component Data', startTime: 46.5, endTime: 52.3, icon: 'search' },
    { id: '14', name: 'Process Templates', startTime: 52.5, endTime: 58.7, icon: 'code' },
    { id: '15', name: 'Generate HTML', startTime: 59.0, endTime: 65.0, icon: 'code' },

    // Cache operations
    {
      id: '16',
      name: 'Cache Operations',
      startTime: 66.0,
      endTime: 75.8,
      status: 'warning',
      icon: 'refresh',
    },
    { id: '17', name: 'Check Cache', startTime: 66.5, endTime: 68.2, icon: 'refresh' },
    {
      id: '18',
      name: 'Update Cache',
      startTime: 68.5,
      endTime: 75.5,
      status: 'warning',
      icon: 'refresh',
    },

    // Vercel runtime
    { id: '19', name: 'Vercel Runtime', startTime: 17.28, endTime: 106.58, icon: 'server' },
    { id: '20', name: 'Invocation Response', startTime: 17.5, endTime: 106.08, icon: 'server' },

    // Final response
    { id: '21', name: 'Generate Response', startTime: 106.6, endTime: 112.0, icon: 'code' },
    { id: '22', name: 'Compress Data', startTime: 107.0, endTime: 109.5, icon: 'cpu' },
    { id: '23', name: 'Set Headers', startTime: 109.7, endTime: 111.5, icon: 'code' },

    // Highlighted span
    {
      id: '24',
      name: 'GET supabase-design-system.vercel.app/design-system',
      startTime: 18,
      endTime: 93,
      level: 3,
      highlight: true,
      method: 'GET',
      icon: 'globe',
    },
  ],
  // Add markers for important events
  markers: [
    { id: 'm1', name: 'Auth Complete', time: 15.8, type: 'info' },
    { id: 'm2', name: 'API Error', time: 45.2, type: 'error' },
    { id: 'm3', name: 'Cache Warning', time: 75.8, type: 'warning' },
    { id: 'm4', name: 'Response Sent', time: 112.0, type: 'success' },
  ],
  duration: 120, // Total duration in ms
}

// Example trace data that matches the screenshot
export const vercelRuntimeTraceData: TraceData = {
  spans: [
    // Top row spans
    { id: '1', name: 'Vercel Runtime', startTime: 0, endTime: 89.5, level: 0, icon: 'server' },
    { id: '2', name: 'Invocation Response', startTime: 0, endTime: 45.8, level: 1, icon: 'server' },
    { id: '3', name: 'HTTP Request', startTime: 0, endTime: 67.2, level: 1, icon: 'globe' },

    // Processing steps
    { id: '4', name: 'Fetch Data', startTime: 46.2, endTime: 58.5, level: 1, icon: 'database' },
    { id: '5', name: 'Process Results', startTime: 59.0, endTime: 72.3, level: 1, icon: 'cpu' },
    { id: '6', name: 'Generate Response', startTime: 72.8, endTime: 82.5, level: 1, icon: 'code' },
    { id: '7', name: 'Update Cache', startTime: 83.0, endTime: 88.7, level: 1, icon: 'refresh' },

    // Highlighted request
    {
      id: '8',
      name: 'GET supabase-design-system.vercel.app/design-system',
      startTime: 0,
      endTime: 88.0,
      level: 2,
      highlight: true,
      method: 'GET',
      icon: 'globe',
    },
  ],
  markers: [],
  duration: 100, // Total duration in ms
}

// Hierarchical trace data example with HTTP methods
export const hierarchicalTraceData: TraceData = {
  spans: [
    // Root span
    {
      id: 'root',
      name: 'GET /api/data',
      startTime: 0,
      endTime: 100,
      level: 0,
      method: 'GET',
      icon: 'globe',
    },

    // First level children
    { id: 'a', name: 'Auth Middleware', startTime: 5, endTime: 80, level: 1, icon: 'lock' },
    { id: 'e', name: 'Response Generation', startTime: 85, endTime: 100, level: 1, icon: 'code' },

    // Second level children
    { id: 'b', name: 'Verify Token', startTime: 10, endTime: 30, level: 2, icon: 'lock' },
    {
      id: 'c',
      name: 'POST /auth/validate',
      startTime: 25,
      endTime: 60,
      level: 2,
      method: 'POST',
      icon: 'globe',
    },
    { id: 'd', name: 'Database Query', startTime: 65, endTime: 75, level: 2, icon: 'database' },
  ],
  markers: [],
  duration: 100,
}

// PostgREST API request trace
export const postgrestTraceData: TraceData = {
  spans: [
    {
      id: '1',
      name: 'GET /rest/v1/projects',
      startTime: 0,
      endTime: 90,
      method: 'GET',
      icon: 'globe',
    },
    { id: '2', name: 'Auth: Validate JWT', startTime: 5, endTime: 15, icon: 'lock' },
    { id: '3', name: 'PostgREST Routing', startTime: 16, endTime: 25, icon: 'code' },
    { id: '4', name: 'RLS Policy Check', startTime: 26, endTime: 35, icon: 'shield' },
    { id: '5', name: 'SQL: SELECT projects', startTime: 36, endTime: 70, icon: 'database' },
    { id: '6', name: 'Serialize JSON', startTime: 71, endTime: 85, icon: 'cpu' },
    { id: '7', name: 'Send Response', startTime: 86, endTime: 90, icon: 'arrow-up-right' },
  ],
  markers: [
    { id: 'm1', name: 'Auth Complete', time: 15, type: 'info' },
    { id: 'm2', name: 'Query Complete', time: 70, type: 'success' },
  ],
  duration: 90,
}

// Storage upload trace
export const storageTraceData: TraceData = {
  spans: [
    {
      id: '1',
      name: 'POST /storage/v1/object',
      startTime: 0,
      endTime: 110,
      method: 'POST',
      icon: 'globe',
    },
    { id: '2', name: 'Auth: Validate Access Token', startTime: 5, endTime: 20, icon: 'lock' },
    { id: '3', name: 'Check Bucket Policy', startTime: 21, endTime: 35, icon: 'shield' },
    { id: '4', name: 'Upload to S3 (minio)', startTime: 36, endTime: 85, icon: 'upload' },
    {
      id: '5',
      name: 'Insert File Metadata (Postgres)',
      startTime: 86,
      endTime: 105,
      icon: 'database',
    },
    { id: '6', name: 'Send 200 OK', startTime: 106, endTime: 110, icon: 'arrow-up-right' },
  ],
  markers: [{ id: 'm1', name: 'Upload Complete', time: 105, type: 'success' }],
  duration: 110,
}

// Edge function execution trace
export const functionsTraceData: TraceData = {
  spans: [
    {
      id: '1',
      name: 'POST /functions/v1/hello',
      startTime: 0,
      endTime: 95,
      method: 'POST',
      icon: 'globe',
    },
    { id: '2', name: 'Auth Middleware', startTime: 5, endTime: 15, icon: 'lock' },
    { id: '3', name: 'Deno Boot (cold start)', startTime: 16, endTime: 40, icon: 'server' },
    { id: '4', name: 'Run Edge Function: hello()', startTime: 41, endTime: 80, icon: 'code' },
    { id: '5', name: 'Return JSON Response', startTime: 81, endTime: 95, icon: 'cpu' },
  ],
  markers: [{ id: 'm1', name: 'Function Executed', time: 80, type: 'success' }],
  duration: 95,
}

// Realtime connection trace
export const realtimeTraceData: TraceData = {
  spans: [
    {
      id: '1',
      name: 'CONNECT /realtime/v1',
      startTime: 0,
      endTime: 60,
      method: 'OPTIONS',
      icon: 'globe',
    },
    { id: '2', name: 'Validate Access Token', startTime: 1, endTime: 10, icon: 'lock' },
    {
      id: '3',
      name: 'Join Channel: public:messages',
      startTime: 11,
      endTime: 25,
      icon: 'message-square',
    },
    { id: '4', name: 'Presence Sync', startTime: 26, endTime: 40, icon: 'users' },
    { id: '5', name: 'Listen for Changes', startTime: 41, endTime: 60, icon: 'radio' },
  ],
  markers: [{ id: 'm1', name: 'Channel Joined', time: 25, type: 'info' }],
  duration: 60,
}

// Export all trace data sets with labels for the dropdown
export const traceDataSets = [
  { id: 'hierarchical', label: 'API Request with Auth', data: hierarchicalTraceData },
  { id: 'sample', label: 'Complex Web Request', data: sampleTraceData },
  { id: 'vercel', label: 'Vercel Runtime', data: vercelRuntimeTraceData },
  { id: 'postgrest', label: 'PostgREST API', data: postgrestTraceData },
  { id: 'storage', label: 'Storage Upload', data: storageTraceData },
  { id: 'functions', label: 'Edge Function', data: functionsTraceData },
  { id: 'realtime', label: 'Realtime Connection', data: realtimeTraceData },
]
