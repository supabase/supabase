# Supabase Realtime

> Sync client state globally over WebSockets in real time.

Supabase Realtime enables live data synchronization between your database and connected clients. It provides three capabilities: listening to database changes, tracking user presence, and broadcasting arbitrary messages between clients.

## Capabilities

### Database Changes
Listen to Postgres INSERT, UPDATE, and DELETE events in real time. Subscribe to specific tables, filter by columns, and receive only the changes you care about. Powered by Postgres logical replication.

### Presence
Store and synchronize online user state across all connected clients. Track who is online, what page they are viewing, or their cursor position. State is automatically cleaned up when clients disconnect.

### Broadcast
Send arbitrary messages to all clients subscribed to the same Channel. Useful for typing indicators, live cursors, game state, notifications, or any real-time communication that does not need to be persisted.

## Technical Details

- Transport: WebSockets
- Protocol: Phoenix Channels
- Database integration: Postgres logical replication (CDC)
- Client libraries: JavaScript (supabase-js), Dart (Flutter), Swift, Kotlin
- Authorization: Row Level Security policies applied to database change subscriptions
- Scaling: horizontally scalable across multiple nodes

## Common Use Cases

- Collaborative editing and live cursors
- Chat and messaging applications
- Live dashboards and analytics
- Multiplayer games
- Notifications and activity feeds
- Auction and bidding systems

## Links

- Documentation: https://supabase.com/docs/guides/realtime
- API Reference: https://supabase.com/docs/reference/javascript/subscribe
- Dashboard: https://supabase.com/dashboard
