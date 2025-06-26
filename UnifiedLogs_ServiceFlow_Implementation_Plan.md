# UnifiedLogs Service Flow Implementation Plan

## Overview

The Service Flow feature enhances the UnifiedLogs inspection panel by showing how requests flow through different layers of Supabase's infrastructure. Instead of just showing raw log data, it provides a visual journey showing how a request travels from the network layer through services to the database.

## Current Implementation Status ✅

### Infrastructure Complete

- **ServiceFlowPanel Component**: `apps/studio/components/interfaces/UnifiedLogs/ServiceFlowPanel.tsx`
- **React Query Hook**: `apps/studio/data/logs/unified-log-inspection-query.ts`
- **SQL Queries**: `apps/studio/components/interfaces/UnifiedLogs/Queries/ServiceFlowQueries/ServiceFlow.sql.ts`
- **Integration**: Fully integrated into main UnifiedLogs component with tab system

### What's Working

1. **Tab Detection**: Service Flow tab only appears for `/rest/` requests
2. **Data Fetching**: Successfully queries logs.all API endpoint with proper timestamp ranges
3. **No UI Reloading**: Fixed infinite re-render issue by excluding `logId` from main query params
4. **Real Data**: Returns actual log data for selected PostgREST requests
5. **Proper Correlation**: Uses same timestamp range as main logs table (not manual time windows)
6. **Rich Data Extraction**: SQL query extracts 35+ useful fields with flattened naming
7. **Filtering Integration**: BlockField components integrate with existing filter system

### Current Display

- Shows service flow blocks with real data from flattened SQL query
- Displays enriched data from 35+ extracted fields
- Includes complete raw log data for debugging
- All fields properly integrated with filtering system

## Architecture Design

### Service Flow Types System

The system is designed around **modular blocks** that can be reused across different service types:

```
Service Type "postgrest" = 5 blocks:
┌─────────────────┐
│ RequestStarted  │ ← Simple timeline marker
├─────────────────┤
│ NetworkBlock    │ ← Request metadata (host, path, method, location)
├─────────────────┤
│ PostgRESTBlock  │ ← API layer (status, message)
├─────────────────┤
│ PostgresBlock   │ ← Database layer (execution time, version, etc.)
├─────────────────┤
│ ResponseCompleted│ ← Simple completion marker
└─────────────────┘
```

### Future Service Types (Planned)

- **"auth"**: `RequestStarted` + `NetworkBlock` + `AuthBlock` + `PostgresBlock` + `ResponseCompleted`
- **"storage"**: `RequestStarted` + `NetworkBlock` + `StorageBlock` + `ResponseCompleted`
- **"functions"**: `RequestStarted` + `NetworkBlock` + `FunctionsBlock` + `ExternalAPIsBlock` + `ResponseCompleted`
- **"realtime"**: `RequestStarted` + `NetworkBlock` + `RealtimeBlock` + `PostgresBlock` + `ResponseCompleted`

### Block Component Architecture

**Timeline Markers (Simple):**

```typescript
MemoizedRequestStartedBlock // Shows request initiation time
MemoizedResponseCompletedBlock // Shows completion status and time
```

**Service Blocks (Detailed with filtering):**

```typescript
MemoizedNetworkBlock // Request metadata, client location, headers
MemoizedPostgRESTBlock // API layer status, messages
MemoizedPostgresBlock // Database layer execution details
// Future: MemoizedAuthBlock, MemoizedStorageBlock, etc.
```

**Service Flow Configuration:**

```typescript
const SERVICE_FLOW_CONFIGS = {
  postgrest: {
    blocks: [
      RequestStartedBlock,
      NetworkBlock,
      PostgRESTBlock,
      PostgresBlock,
      ResponseCompletedBlock,
    ],
    query: getPostgrestServiceFlowQuery,
  },
  auth: {
    blocks: [RequestStartedBlock, NetworkBlock, AuthBlock, PostgresBlock, ResponseCompletedBlock],
    query: getAuthServiceFlowQuery,
  },
  // etc...
}
```

## Data Extraction & Structure

### SQL Query Data Flattening

The SQL query extracts nested JSON into flat, meaningful field names:

```sql
-- Instead of: metadata.request.cf.country
-- We get: "client.country"

select
  -- Request data
  edge_logs_request.path as "request.path",
  edge_logs_request.host as "request.host",
  edge_logs_request.method as "request.method",
  -- Client location
  edge_logs_request.cf.country as "client.country",
  edge_logs_request.cf.city as "client.city",
  edge_logs_request.cf.latitude as "client.latitude",
  edge_logs_request.cf.longitude as "client.longitude",
  -- Headers
  edge_logs_request.headers.user_agent as "headers.user_agent",
  edge_logs_request.headers.x_client_info as "headers.x_client_info",
  -- JWT data
  sb.jwt.apikey.payload.role as "jwt.apikey_role",
  sb.jwt.authorization.payload.role as "jwt.auth_role",
  -- Raw data for debugging
  el as raw_log_data;
```

### Extracted Fields (35+ total)

**Request Data**: `request.path`, `request.host`, `request.method`, `request.url`
**Response Data**: `response.origin_time`, `response.content_type`, `response.cache_status`
**Client Location**: `client.continent`, `client.country`, `client.city`, `client.latitude`, `client.longitude`, `client.timezone`
**Network Data**: `network.protocol`, `network.datacenter`
**Headers**: `headers.user_agent`, `headers.x_client_info`, `headers.x_forwarded_proto`, `headers.x_real_ip`
**JWT Data**: `jwt.apikey_role`, `jwt.auth_role`, `jwt.apikey_expires_at`, etc.
**Raw Data**: `raw_log_data` (complete original log entry)

## Current Data Flow

### 1. User Interaction

```
User clicks log row → rowSelection changes → URL params updated with logId
```

### 2. Query Execution

```typescript
// ServiceFlowPanel.tsx
const realLogId = search?.logId || selectedRow?.id

useUnifiedLogInspectionQuery({
  projectRef,
  logId: realLogId,
  type: 'postgrest',
  search: searchParameters, // Contains user's date filters
})
```

### 3. API Call

```typescript
// unified-log-inspection-query.ts
const { isoTimestampStart, isoTimestampEnd } = getUnifiedLogsISOStartEnd(search)

await post('/platform/projects/{ref}/analytics/endpoints/logs.all', {
  params: { path: { ref: projectRef } },
  body: {
    iso_timestamp_start: isoTimestampStart,
    iso_timestamp_end: isoTimestampEnd,
    sql: getPostgrestServiceFlowQuery(logId),
  },
})
```

### 4. SQL Query

```sql
-- ServiceFlow.sql.ts - Extracts 35+ flattened fields
select
  id,
  timestamp,
  edge_logs_request.host as "request.host",
  edge_logs_request.cf.country as "client.country",
  -- ... 30+ more fields
  el as raw_log_data
from edge_logs
where el.id = '${logId}' and edge_logs_request.path like '%/rest/%';
```

## Filtering Integration

### BlockField Component

Each field in service blocks integrates with the existing filtering system:

```typescript
const BlockField = ({ config, data, enrichedData, filterFields, table }) => {
  // Check if field is filterable
  const filterField = filterFields.find((field) => field.value === config.id)
  const isFilterable = !!filterField

  if (isFilterable) {
    return (
      <DataTableSheetRowAction
        fieldValue={config.id}
        filterFields={filterFields}
        value={stringValue}
        table={table}
        className="hover:bg-accent/50 cursor-pointer" // Full row clickable
      >
        {fieldContent}
      </DataTableSheetRowAction>
    )
  }
  // ... non-filterable display
}
```

### Filterable Fields

Fields that match existing `filterFields` become clickable with right-click context menus:

- **host** → Input filter
- **pathname** → Input filter
- **method** → Checkbox filter
- **status** → Checkbox filter
- **date** → Time range filter

## Future Enhancements

### Phase 1: User Agent Parsing & Icons 🎯

**Problem**: Raw user agent strings are hard to read

```
"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"
```

**Solution**: Parse and display with intuitive icons

```typescript
function parseUserAgent(userAgent: string) {
  return {
    type: 'browser' | 'mobile' | 'server' | 'bot',
    browser: string, // 'Chrome', 'Safari', 'Node.js'
    os: string, // 'macOS', 'iOS', 'Windows', 'Linux'
    device: string, // 'Desktop', 'iPhone', 'Android', 'Server'
    displayName: string, // 'Chrome on macOS', 'Safari on iPhone'
  }
}
```

**Display with Icons**:

- 🖥️ Chrome on macOS (browser + desktop)
- 📱 Safari on iPhone (browser + mobile)
- ⚙️ Node.js Server (server icon)
- 🤖 Googlebot (bot icon)
- 📱 React Native App (mobile app)

**Icon Categories**:

- **Browsers**: Chrome, Safari, Firefox, Edge logos
- **Devices**: 🖥️ Desktop, 📱 Phone, 📱 Tablet
- **Platforms**: 🍎 Apple, 🪟 Windows, 🐧 Linux, ⚙️ Server
- **Special**: 🤖 Bot, 📱 Mobile App, ⚡ API Client

**Benefits**: Instantly identify client types for debugging browser-specific, mobile-specific, or server-side issues.

### Phase 2: Additional Service Types (Next)

1. **Implement auth service flow**
2. **Implement storage service flow**
3. **Add service type detection logic**

### Phase 3: Advanced Features (Later)

1. **Geographic visualization** (using lat/lng data)
2. **Performance timeline** (request → response timing)
3. **Error correlation** (link errors across service layers)
4. **Export/share service flow** (for support tickets)

## Technical Considerations

### Performance

- All blocks are memoized to prevent unnecessary re-renders
- SQL query extracts data once, flattened for easy access
- Only re-render when data actually changes

### Error Handling

- Each block handles missing data gracefully (shows "N/A")
- No hardcoded fallback values (removed all fake data)
- Raw log data available for debugging edge cases

### Filtering Integration

- Block fields are clickable only if they exist in `filterFields`
- Uses existing `DataTableSheetRowAction` component
- Full row hover/click states for better UX
- Integrates with existing filter mechanisms

### Extensibility

- Blocks designed to be reusable across service types
- Service-specific logic contained within blocks
- Easy to add new service types via configuration

## Files Modified

### Core Files

- `apps/studio/components/interfaces/UnifiedLogs/ServiceFlowPanel.tsx` - Main panel component
- `apps/studio/components/interfaces/UnifiedLogs/UnifiedLogs.tsx` - Integration point
- `apps/studio/data/logs/unified-log-inspection-query.ts` - React Query hook
- `apps/studio/components/interfaces/UnifiedLogs/Queries/ServiceFlowQueries/ServiceFlow.sql.ts` - SQL queries
- `apps/studio/components/interfaces/UnifiedLogs/ServiceFlow/ServiceFlowBlocks.tsx` - Block components

### Supporting Files

- `apps/studio/data/logs/keys.ts` - Query keys
- `apps/studio/data/logs/index.ts` - Exports

## Key Lessons Learned

1. **Flatten data in SQL, not in components** - Better performance and simpler access patterns
2. **No hardcoded fallbacks** - Show real data or "N/A", never fake data
3. **Integrate with existing systems** - Reuse filtering infrastructure instead of rebuilding
4. **Separate timeline markers from service blocks** - Different components for different purposes
5. **Extract meaningful field names** - `client.country` not `cf.country`
6. **Include raw data for debugging** - Power users need access to complete log structure

## Success Criteria

✅ **Phase 1 Complete When:**

- Service Flow tab shows blocks with real data
- Filtering integration works (clickable fields)
- No hardcoded values, all real data
- Raw log data available for debugging
- Performance optimized with memoization

🎯 **User Agent Enhancement Complete When:**

- User agents display as clean text with icons
- Easy to identify client types at a glance
- Icons help distinguish browser/mobile/server requests

**Full Feature Complete When:**

- Multiple service types supported
- Geographic and performance visualizations
- Export/sharing capabilities
- Comprehensive debugging toolkit
