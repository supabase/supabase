---
# Specify the following for Cursor rules
description: Coding rules for Supabase Realtime
alwaysApply: false
---

# Supabase Realtime AI Assistant Guide

You are an expert developer assistant specializing in Supabase Realtime implementations. This guide provides structured, actionable patterns for AI-driven development assistance.

## Implementation Rules

### Do
- Use `broadcast` for all realtime events (database changes via triggers, messaging, notifications, game state)
- Use `presence` sparingly for user state tracking (online status, user counters)
- Create indexes for all columns used in RLS policies
- Advice to use topic names that corrolate with concepts and tables: `scope:entity` (e.g., `room:123:messages`)
- Use snake_case for event names: `entity_action` (e.g., `message_created`)
- Include unsubscribe/cleanup logic in all implementations
- Set `private: true` for channels using database triggers or RLS policies
- Give preference to use private channels over public channels (better security and control)
- Implement proper error handling and reconnection logic

### Don't
- Use `postgres_changes` for new applications (single-threaded, doesn't scale well) and help migrate to `broadcast from database` on existing applications if necessary
- Create multiple subscriptions without proper cleanup
- Write complex RLS queries without proper indexing
- Use generic event names like "update" or "change"
- Subscribe directly in render functions without state management
- Use database functions (`realtime.send`, `realtime.broadcast_changes`) in client code

## Function Selection Decision Table

| Use Case | Recommended Function | Why Not postgres_changes |
|----------|---------------------|--------------------------|
| Custom payloads with business logic | `broadcast` | More flexible, better performance |
| Database change notifications | `broadcast` via database triggers | More scalable, customizable payloads |
| High-frequency updates | `broadcast` with minimal payload | Better throughput and control |
| User presence/status tracking | `presence` (sparingly) | Specialized for state synchronization |
| Simple table mirroring | `broadcast` via database triggers | More scalable, customizable payloads |
| Client to client communication | `broadcast` without triggers and using only websockets | More flexible, better performance |

**Note:** `postgres_changes` should be avoided due to scalability limitations. Use `broadcast` with database triggers (`realtime.broadcast_changes`) for all database change notifications.

## Scalability Best Practices

### Dedicated Topics for Better Performance
Using dedicated, granular topics ensures messages are only sent to relevant listeners, significantly improving scalability:

**❌ Avoid Broad Topics:**
```javascript
// This broadcasts to ALL users, even those not interested
const channel = supabase.channel('global:notifications')
```

**✅ Use Dedicated Topics:**
```javascript
// This only broadcasts to users in a specific room
const channel = supabase.channel(`room:${roomId}:messages`)

// This only broadcasts to a specific user
const channel = supabase.channel(`user:${userId}:notifications`)

// This only broadcasts to users with specific permissions
const channel = supabase.channel(`admin:${orgId}:alerts`)
```

### Benefits of Dedicated Topics:
- **Reduced Network Traffic**: Messages only reach interested clients
- **Better Performance**: Fewer unnecessary message deliveries
- **Improved Security**: Easier to implement targeted RLS policies
- **Scalability**: System can handle more concurrent users efficiently
- **Cost Optimization**: Reduced bandwidth and processing overhead

### Topic Naming Strategy:
- **One topic per room**: `room:123:messages`, `room:123:presence`
- **One topic per user**: `user:456:notifications`, `user:456:status`
- **One topic per organization**: `org:789:announcements`
- **One topic per feature**: `game:123:moves`, `game:123:chat`

## Naming Conventions

### Topics (Channels)
- **Pattern:** `scope:entity` or `scope:entity:id`
- **Examples:** `room:123:messages`, `game:456:moves`, `user:789:notifications`
- **Public channels:** `public:announcements`, `global:status`

### Events
- **Pattern:** `entity_action` (snake_case)
- **Examples:** `message_created`, `user_joined`, `game_ended`, `status_changed`
- **Avoid:** Generic names like `update`, `change`, `event`

## Client Setup Patterns

```javascript
// Basic setup
const supabase = createClient('URL', 'ANON_KEY')

// Channel configuration
const channel = supabase.channel('room:123:messages', {
  config: {
    broadcast: { self: true, ack: true },
    presence: { key: 'user-session-id', enabled: true },
    private: true  // Required for RLS authorization
  }
})
```

### Configuration Options

#### Broadcast Configuration
- **`self: true`** - Receive your own broadcast messages
- **`ack: true`** - Get acknowledgment when server receives your message

#### Presence Configuration
- **`enabled: true`** - Enable presence tracking for this channel. This flag is set automatically by client library if `on('presence')` is set.
- **`key: string`** - Custom key to identify presence state (useful for user sessions)

#### Security Configuration
- **`private: true`** - Require authentication and RLS policies
- **`private: false`** - Public channel (default, not recommended for production)

## Frontend Framework Integration

### React Pattern
```javascript
const channelRef = useRef(null)

useEffect(() => {
  // Check if already subscribed to prevent multiple subscriptions
  if (channelRef.current?.state === 'subscribed') return
  const channel = supabase.channel('room:123:messages', {
    config: { private: true }
  })
  channelRef.current = channel

  // Set auth before subscribing
  await supabase.realtime.setAuth()

  channel
    .on('broadcast', { event: 'message_created' }, handleMessage)
    .on('broadcast', { event: 'user_joined' }, handleUserJoined)
    .subscribe()

  return () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }
}, [roomId])
```

## Database Triggers

### Using realtime.broadcast_changes (Recommended for database changes)
This would be an example of catch all trigger function that would broadcast to topics starting with the table name and the id of the row.
```sql
CREATE OR REPLACE FUNCTION notify_table_changes()
RETURNS TRIGGER AS $$
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    TG_TABLE_NAME ||':' || COALESCE(NEW.id, OLD.id)::text,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;
```
But you can also create more specific trigger functions for specific tables and events so adapt to your use case:

```sql
CREATE OR REPLACE FUNCTION room_messages_broadcast_trigger()
RETURNS TRIGGER AS $$
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'room:' || COALESCE(NEW.room_id, OLD.room_id)::text,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;
```

By default, `realtime.broadcast_changes` requires you to use private channels as we did this to prevent security incidents.

### Using realtime.send (For custom messages)
```sql
CREATE OR REPLACE FUNCTION notify_custom_event()
RETURNS TRIGGER AS $$
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM realtime.send(
    'room:' || NEW.room_id::text,
    'status_changed',
    jsonb_build_object('id', NEW.id, 'status', NEW.status),
    false
  );
  RETURN NEW;
END;
$$;
```
This allows us to broadcast to a specific room with any content that is not bound to a table or if you need to send data to public channels. It's also a good way to integrate with other services and extensions.

### Conditional Broadcasting
If you need to broadcast only significant changes, you can use the following pattern:
```sql
-- Only broadcast significant changes
IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
  PERFORM realtime.broadcast_changes(
    'room:' || NEW.room_id::text,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
END IF;
```
This is just an example as you can use any logic you want that is SQL compatible.

## Authorization Setup

### Basic RLS Setup
To access a private channel you need to set RLS policies against `realtime.messages` table for SELECT operations.
```sql
-- Simple policy with indexed columns
CREATE POLICY "room_members_can_read" ON realtime.messages
FOR SELECT TO authenticated
USING (
  topic LIKE 'room:%' AND
  EXISTS (
    SELECT 1 FROM room_members
    WHERE user_id = auth.uid()
    AND room_id = SPLIT_PART(topic, ':', 2)::uuid
  )
);

-- Required index for performance
CREATE INDEX idx_room_members_user_room
ON room_members(user_id, room_id);
```

To write to a private channel you need to set RLS policies against `realtime.messages` table for INSERT operations.

```sql
-- Simple policy with indexed columns
CREATE POLICY "room_members_can_write" ON realtime.messages
FOR INSERT TO authenticated
USING (
  topic LIKE 'room:%' AND
  EXISTS (
    SELECT 1 FROM room_members
    WHERE user_id = auth.uid()
    AND room_id = SPLIT_PART(topic, ':', 2)::uuid
  )
);
```

### Client Authorization
```javascript
const channel = supabase.channel('room:123:messages', {
  config: { private: true }
})
  .on('broadcast', { event: 'message_created' }, handleMessage)
  .on('broadcast', { event: 'user_joined' }, handleUserJoined)

// Set auth before subscribing
await supabase.realtime.setAuth()

// Subscribe after auth is set
await channel.subscribe()
```

### Enhanced Security: Private-Only Channels
**Enable private-only channels** in Realtime Settings (Dashboard > Project Settings > Realtime Settings) to enforce authorization on all channels and prevent public channel access. This setting requires all clients to use `private: true` and proper authentication, providing additional security for production applications.

## Error Handling & Reconnection

### Automatic Reconnection (Built-in)
**Supabase Realtime client handles reconnection automatically:**
- Built-in exponential backoff for connection retries
- Automatic channel rejoining after network interruptions
- Configurable reconnection timing via `reconnectAfterMs` option

### Channel States
The client automatically manages these states:
- **`SUBSCRIBED`** - Successfully connected and receiving messages
- **`TIMED_OUT`** - Connection attempt timed out
- **`CLOSED`** - Channel is closed
- **`CHANNEL_ERROR`** - Error occurred, client will automatically retry

```javascript
// Client automatically reconnects with built-in logic
const supabase = createClient('URL', 'ANON_KEY', {
  realtime: {
    params: {
      log_level: 'info',
      reconnectAfterMs: 1000 // Custom reconnection timing
    }
  }
})

// Simple connection state monitoring
channel.subscribe((status, err) => {
  switch (status) {
    case 'SUBSCRIBED':
      console.log('Connected (or reconnected)')
      break
    case 'CHANNEL_ERROR':
      console.error('Channel error:', err)
      // Client will automatically retry - no manual intervention needed
      break
    case 'CLOSED':
      console.log('Channel closed')
      break
  }
})
```

## Performance & Scaling Guidelines

### Channel Structure Optimization
- Use one channel per logical scope (`room:123`, not `user:456:room:123`)
- Shard high-volume topics: `chat:shard:1`, `chat:shard:2`
- Ensure you have enough connections set in your pool, you can refer to [Realtime Settings](https://supabase.com/docs/guides/realtime/settings) and the option `Database connection pool size` to set it.

## Debugging

### Enhanced Logging
```javascript
const supabase = createClient(url, key, {
  realtime: {
    params: { log_level: 'info' }
  }
})
```

## Migration from Postgres Changes

### Step 1: Replace Client Code
```javascript
// ❌ Remove postgres_changes
const oldChannel = supabase.channel('changes').on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, callback)

// ✅ Replace with broadcast
const room_id = "room_id" // or any other identifier that you use in the trigger function
const newChannel = supabase.channel(`messages:${room_id}:changes`, {
  config: { private: true }
})
.on('broadcast', { event: 'INSERT' }, callback)
.on('broadcast', { event: 'DELETE' }, callback)
.on('broadcast', { event: 'UPDATE' }, callback)
```

### Step 2: Add Database Trigger (Only if using broadcast)
```sql
CREATE TRIGGER messages_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON messages
  FOR EACH ROW EXECUTE FUNCTION notify_table_changes();
```

### Step 3: Setup Authorization (Only if using broadcast)
```sql
CREATE POLICY "users_can_receive_broadcasts" ON realtime.messages
  FOR SELECT TO authenticated USING (true);
```

## LLM Implementation Guidelines

### When Generating Code
1. **Prefer using `broadcast` over `postgres_changes`** - Never suggest `postgres_changes`
2.**Include state checking** - Check channel state before subscribing
3. **Add cleanup logic** - Include unsubscribe in all examples
4. **Suggest proper naming** - Use consistent topic/event conventions
5. **Include error handling** - Add reconnection patterns
6. **Recommend indexing** - When RLS policies are used
7. **Framework-agnostic** - Adapt patterns to user's framework
8. **Inform users to prefer the usage of private channels only** - users can refer to [Realtime Settings](https://supabase.com/docs/guides/realtime/settings) to enable it.

### Code Generation Checklist
- ✅ Favor `broadcast` over `postgres_changes`
- ✅ Checks `channel.state` before subscribing
- ✅ Includes proper cleanup/unsubscribe logic
- ✅ Uses consistent naming conventions
- ✅ Includes error handling and reconnection
- ✅ Suggests indexes for RLS policies
- ✅ Sets `private: true` for database triggers
- ✅ Implements token refresh if needed

### Safe Defaults for AI Assistants
- Channel pattern: `scope:entity:id`
- Event pattern: `entity_action`
- Always check channel state before subscribing
- Always include cleanup
- Default to `private: true` for database-triggered channels
- Suggest basic RLS policies with proper indexing
- Include reconnection logic for production apps
- Use `broadcast` with database triggers for all database change notifications
- Use `broadcast` for custom events and complex payloads

**Remember:** Choose the right function for your use case, emphasize proper state management, and ensure production-ready patterns with authorization and error handling.