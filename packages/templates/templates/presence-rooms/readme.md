# Presence rooms template

Complements Supabase Realtime Presence with durable room and membership data. Supabase Presence remains the source of truth for ephemeral online state; these tables answer durable questions like who can join a room, who was last seen, and which rooms exist.

## How it works

1. Create a room in `public.presence_rooms`.
2. Add members to `public.presence_room_members`.
3. Clients subscribe to a Realtime channel such as `presence-room:<room_id>` and use native Presence `track()` / `untrack()`.
4. Clients can periodically call `public.touch_presence_room(...)` to persist last-seen state for server rendering, reconnects, or audit views.
5. A cleanup helper marks expired heartbeat rows offline.

## Includes

- `supabase/schemas/presence-rooms.sql` - rooms, memberships, heartbeat table, RLS, cleanup helper, and Realtime publication

## Notes

This template does not reimplement Supabase Realtime Presence. Use the Realtime client for live `sync`, `join`, and `leave` events, and use these tables for authorization and durable state.
