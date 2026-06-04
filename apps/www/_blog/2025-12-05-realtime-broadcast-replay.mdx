---
title: 'Realtime: Broadcast Replay'
description: ''
author: eduardo_gurgel
imgSocial: 2025-12-05-realtime-broadcast-replay/og.png
imgThumb: 2025-12-05-realtime-broadcast-replay/thumb.png
categories:
  - product
tags:
  - realtime
date: '2025-12-05'
toc_depth: 2
---

Today we're releasing Broadcast Replay for Realtime - a powerful new feature that enables private channels to access messages that were sent earlier, ensuring your users never miss critical updates.

## The Challenge: Missing Important Messages in Real-time Applications

Building real-time applications comes with unique challenges. What happens when:

- A user's connection drops momentarily?
- Someone joins a collaborative session mid-way?
- A page reload occurs during an important update?
- Network interruptions cause missed messages?

Previously, these scenarios meant lost context and degraded user experiences. Users would miss important messages sent while they were disconnected, and developers had to implement complex workarounds to maintain state consistency.

## Introducing Broadcast Replay

Broadcast Replay solves these challenges by allowing private channels to retrieve messages that were sent before a client connected or while they were disconnected. This feature integrates seamlessly with our existing [Broadcast from Database](/docs/guides/realtime/broadcast#broadcast-from-the-database) functionality, storing messages in the `realtime.messages` table for up to 3 days.

It leverages the messages already stored when using Broadcast from Database. When you enable replay on a private channel, Realtime queries the partitioned `realtime.messages` table to retrieve historical messages based on your configuration.

The replay configuration accepts two parameters:

- **`since`** (required): Unix timestamp in milliseconds specifying the earliest point from which messages should be retrieved;
- **`limit`** (optional): Number of messages to return (1-25, useful for preventing information overload).

You can see Broadcast Replay in action at [https://multiplayer.dev](https://multiplayer.dev/), where the chat box demonstrates how users can access historical messages when joining or reconnecting to a conversation.

## Real-World Use Cases

### Chat Applications

Display the most recent messages when users enter a chat room, providing immediate context without complex state management:

```jsx
const chatChannel = supabase.channel(`chat:${roomId}`, {
  config: {
    private: true,
    broadcast: {
      replay: {
        since: Date.now() - 300000, // Last 5 minutes
        limit: 25, // Show last 25 messages
      },
    },
  },
})
```

### Live Sports Updates

Ensure fans never miss crucial moments, even after connection issues:

```jsx
const gameChannel = supabase.channel(`game:${matchId}:key-events`, {
  config: {
    private: true,
    broadcast: {
      replay: {
        since: matchStartTime, // Replay from match start
        limit: 20, // Show key events
      },
    },
  },
})
```

### Collaborative Editing

Highlight recent changes in documents when users return:

```jsx
const docChannel = supabase.channel(`doc:${documentId}`, {
  config: {
    private: true,
    broadcast: {
      replay: {
        since: lastSeenTimestamp, // Changes since last visit
        limit: 15,
      },
    },
  },
})
```

## Working with Replayed Messages

The triggered events are now enriched with metadata to recognise replayed messages.

```jsx
{
    "event": "message",
    "meta": {
      "id": "55f92208-37c8-4c7b-930d-756f14586e55",
      "replayed": true
    },
    "payload": {
      "content": "Hello world",
      "createdAt": "2025-11-12T15:41:22Z",
      "id": "3f0e4cdf-f886-4b2c-b132-1cedb5c55acc",
      "username": "supabasito"
    },
    "type": "broadcast"
}
```

One can use the `meta.replayed` field to handle historical and live messages differently:

```jsx
// Broadcast callback receives meta field
channel.on('broadcast', { event: 'chat_message' }, (payload) => {
	const chatMessage = payload.payload as ChatMessage
	// Render replayed messages with a different aspect
	chatMessage.replayed = payload?.meta?.replayed ?? false
	setMessages((current) => [...current, chatMessage])
})
```

## Availability

Broadcast Replay is available today in **Public Alpha**. This feature requires:

- Supabase JavaScript client version 2.74.0 or later
- Messages sent via [Broadcast from Database](/docs/guides/realtime/broadcast#broadcast-from-the-database)
- Private channels with appropriate RLS policies

We're actively seeking feedback to refine this feature. If you encounter any issues or have suggestions, please [submit a support ticket](https://supabase.help/).

Check out our [documentation](/docs/guides/realtime/broadcast#broadcast-replay) for detailed implementation guides and more examples.

<div className="video-container">
  <iframe
    className="w-full"
    src="https://www.youtube-nocookie.com/embed/scbQlEH3pRc"
    title="Introducing Realtime Broadcast Replay"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
    allowfullscreen
  />
</div>
