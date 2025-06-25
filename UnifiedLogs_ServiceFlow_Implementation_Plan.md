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

### Current Display

- Shows raw JSON data in a `<pre>` tag
- Displays result count: "PostgREST Service Flow (1 result)"
- Basic loading/error states

## Architecture Design

### Service Flow Types System

The system is designed around **modular blocks** that can be reused across different service types:

```
Service Type "postgrest" = 4 blocks:
┌─────────────┐
│ OriginBlock │ ← Region, time, status
├─────────────┤
│ NetworkBlock│ ← Request ID, path, host, user agent
├─────────────┤
│PostgRESTBlck│ ← Query, status
├─────────────┤
│PostgresBlock│ ← SQL query, query ID
└─────────────┘
```

### Future Service Types (Planned)

- **"auth"**: `OriginBlock` + `NetworkBlock` + `AuthBlock` + `PostgresBlock`
- **"storage"**: `OriginBlock` + `NetworkBlock` + `StorageBlock`
- **"functions"**: `OriginBlock` + `NetworkBlock` + `FunctionsBlock` + `ExternalAPIsBlock`
- **"realtime"**: `OriginBlock` + `NetworkBlock` + `RealtimeBlock` + `PostgresBlock`

### Block Component Architecture

**Reusable Memoized Components:**

```typescript
// Universal blocks (used by all service types)
MemoizedOriginBlock // Region, continent, timestamp, status
MemoizedNetworkBlock // Request metadata (ID, path, host, user agent)

// Service-specific blocks
MemoizedPostgRESTBlock // API layer (query, status)
MemoizedPostgresBlock // Database layer (SQL, query ID)
MemoizedAuthBlock // Auth service specific data
MemoizedStorageBlock // Storage service specific data
MemoizedFunctionsBlock // Edge functions specific data
// etc...
```

**Service Flow Configuration:**

```typescript
const SERVICE_FLOW_CONFIGS = {
  postgrest: {
    blocks: [OriginBlock, NetworkBlock, PostgRESTBlock, PostgresBlock],
    query: getPostgrestServiceFlowQuery,
  },
  auth: {
    blocks: [OriginBlock, NetworkBlock, AuthBlock, PostgresBlock],
    query: getAuthServiceFlowQuery,
  },
  // etc...
}
```

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
-- ServiceFlow.sql.ts
select
  id,
  timestamp,
  'postgrest' as log_type,
  cast(edge_logs_response.status_code as string) as status
-- ... other fields
from edge_logs
where el.id = '${logId}' and edge_logs_request.path like '%/rest/%';
```

## Data Structure

### Current Query Response

```typescript
interface UnifiedLogInspectionEntry {
  id: string
  timestamp: string
  service_name: string
  method: string
  path: string
  host: string
  status_code: string
  level: string
  response_time_ms?: number
  auth_user?: string | null
  api_role?: string | null
  service_specific_data: Record<string, any>
}
```

### Block Data Requirements

**Data Sourcing Strategy:**

- **Base Data**: Available immediately from `selectedRow` (main logs table data)
- **Enriched Data**: Fetched via service flow query for additional service-specific details
- **Note**: Current service flow query is minimal - will be expanded to include more enrichment data

**OriginBlock Data:**

- Region/continent _(enriched - from edge log metadata)_
- Timestamp _(base - from selectedRow.timestamp)_
- Overall request status _(base - from selectedRow.status)_

**NetworkBlock Data:**

- Request ID _(base - selectedRow.id or enriched)_
- Path _(base - selectedRow.path/pathname)_
- Host _(base - selectedRow.host)_
- User Agent _(enriched - from request headers)_

**PostgRESTBlock Data:**

- SQL Query being executed _(enriched - not in main logs)_
- Status code _(base - selectedRow.status)_
- Response time _(enriched - service-specific metrics)_
- Auth role/user _(base - selectedRow.api_role, selectedRow.auth_user)_

**PostgresBlock Data:**

- Raw SQL query _(enriched - from postgres logs correlation)_
- Query ID _(enriched - if available)_
- Execution time _(enriched - from postgres logs)_
- Database connection info _(enriched - from postgres logs)_

## Next Implementation Steps

### Phase 1: Block Components (Immediate)

1. **Create base block component structure**

   ```typescript
   interface ServiceFlowBlockProps {
     data: any
     isLoading?: boolean
     error?: string
   }
   ```

2. **Implement the 4 PostgREST blocks:**

   - `MemoizedOriginBlock`
   - `MemoizedNetworkBlock`
   - `MemoizedPostgRESTBlock`
   - `MemoizedPostgresBlock`

3. **Replace JSON display with block layout**

### Phase 2: Data Enhancement (Next)

1. **Expand SQL query to include enrichment data:**

   - Cross-service correlation (PostgREST → Postgres)
   - Request headers for user agent, region data
   - Performance metrics and timing data
   - SQL query extraction from PostgREST/Postgres logs

2. **Implement base + enriched data merging logic**
3. **Add proper error handling for missing enriched data**
4. **Handle cases where correlation fails gracefully**

### Phase 3: Polish (Later)

1. **Add click-to-filter functionality** (only for fields that exist in `filterFields`)
2. **Add loading states per block**
3. **Add expand/collapse for complex data**
4. **Add copy-to-clipboard for query text**

### Phase 4: Additional Service Types (Future)

1. **Implement auth service flow**
2. **Implement storage service flow**
3. **Add service type detection logic**

## Technical Considerations

### Performance

- All blocks should be memoized to prevent unnecessary re-renders
- Follow the pattern from `MemoizedDataTableSheetContent`
- Only re-render when data actually changes

### Error Handling

- Each block should handle missing data gracefully
- Show "Data not available" states
- Don't break the entire flow if one service layer fails

### Filtering Integration

- Block field items are clickable **only if** that field exists in the existing filter system
- Need to check each field against `filterFields` to determine if it should be clickable
- Fields like status code, host, method, Request ID are likely filterable
- Timestamps might be filterable (e.g., set time range filters)
- Actual filterability depends on what's available in the existing `filterFields` system
- Integration should use existing filter mechanisms, not create new ones

### Extensibility

- Design blocks to be reusable across service types
- Keep service-specific logic contained within blocks
- Make it easy to add new service types

## Files Modified

### Core Files

- `apps/studio/components/interfaces/UnifiedLogs/ServiceFlowPanel.tsx` - Main panel component
- `apps/studio/components/interfaces/UnifiedLogs/UnifiedLogs.tsx` - Integration point
- `apps/studio/data/logs/unified-log-inspection-query.ts` - React Query hook
- `apps/studio/components/interfaces/UnifiedLogs/Queries/ServiceFlowQueries/ServiceFlow.sql.ts` - SQL queries

### Supporting Files

- `apps/studio/data/logs/keys.ts` - Query keys
- `apps/studio/data/logs/index.ts` - Exports

## Key Lessons Learned

1. **Don't manually create timestamps** - Use existing search parameters that contain user's date filters
2. **Exclude logId from main query params** - Prevents infinite re-renders
3. **Follow existing patterns** - Use same timestamp logic as `getUnifiedLogsISOStartEnd()`
4. **Use POST with body for complex queries** - Follow `unified-logs-infinite-query` pattern
5. **Real log IDs vs fabricated UUIDs** - Handle the workaround for repeated logs issue

## Success Criteria

✅ **Phase 1 Complete When:**

- Service Flow tab shows blocks instead of JSON
- Each block displays appropriate data
- No performance regressions
- Proper loading/error states

**Phase 2 Complete When:**

- Data correlation works reliably
- Missing data handled gracefully
- Query returns structured data for all blocks

**Full Feature Complete When:**

- Multiple service types supported
- Click-to-filter functionality
- Professional UI matching design mockups
- Comprehensive error handling
