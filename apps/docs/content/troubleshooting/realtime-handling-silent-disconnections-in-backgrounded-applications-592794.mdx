---
title = "Realtime: Handling Silent Disconnections in Background Applications"
topics = [ "cli", "database", "realtime" ]
keywords = []
database_id = "b826b34a-f7c0-405e-a836-54c543198964"
---

If your Supabase Realtime subscriptions stop receiving events after some time without any explicit error messages, you might be experiencing a silent disconnection. This guide explains why this occurs and provides robust solutions to maintain connection stability.

## Key technical concepts

To understand the problem and its solutions, it's helpful to first define some core technical terms:

- **What is Supabase Realtime?**
  Supabase Realtime is a service that allows your application to listen for and receive instant updates (events) from your Postgres database whenever data changes. It uses WebSocket connections to provide this real-time data streaming.

- **What is a WebSocket?**
  A WebSocket is a communication protocol that provides a full-duplex, persistent communication channel over a single TCP connection. Unlike traditional HTTP requests, WebSockets allow for continuous, bi-directional communication between a client (like your application) and a server, making them ideal for real-time applications.

- **What is a heartbeat?**
  In the context of network connections, a heartbeat is a periodic signal sent between two connected entities (e.g., your client and the Realtime server) to confirm that the connection is still active and both ends are responsive. If a heartbeat is missed for a certain period, it can indicate a connection loss.

- **What is browser throttling?**
  Browser throttling is an optimization strategy employed by web browsers to conserve resources (CPU, battery) when a tab or application is running in the background or is inactive. This often involves reducing the frequency of JavaScript timers, potentially slowing down or pausing background operations.

- **What is a Web Worker?**
  A Web Worker is a JavaScript script that runs in the background, independently of the main browser thread. This allows complex computations or long-running tasks to be executed without freezing or affecting the responsiveness of the user interface.

## Understanding the problem: Why Realtime stops silently

Supabase Realtime relies on maintaining a persistent WebSocket connection to deliver real-time updates. To ensure this connection is active and healthy, the Realtime client periodically sends "heartbeat" signals to the server.

The core issue arises when your application, particularly if it's a web application, moves into a background state (e.g., the browser tab is no longer active, or the application is minimized). In such scenarios, web browsers often implement **browser throttling**. This means the browser reduces the execution frequency of JavaScript timers in the background.

When JavaScript timers are throttled, the Realtime client might be prevented from sending its heartbeats at the required intervals. If the server doesn't receive heartbeats for too long, it assumes the client has disconnected, and the WebSocket connection can **silently drop**. Your application then stops receiving events without any explicit error message, as the connection loss was not actively detected by the client's main thread. Network instability can also contribute to silent disconnections.

## Solutions for robust Realtime connection management

To ensure your Realtime subscriptions remain stable and resilient against silent disconnections, especially in background states, Supabase provides two recommended strategies that can be used together.

### Step 1: Implement `heartbeatCallback` for explicit reconnection

The `heartbeatCallback` option allows you to actively monitor the status of your Realtime connection and programmatically trigger a reconnection if a disconnection is detected.

- **Purpose:** To gain visibility into the connection's health and provide a mechanism for your application to explicitly reconnect when the connection is lost.
- **How it works:** When initializing your `RealtimeClient`, you can provide a `heartbeatCallback` function. This function will be invoked whenever the Realtime client's internal heartbeat mechanism detects a change in the connection's status. By checking if the `status` passed to the callback is `'disconnected'`, you can then call `client.connect()` to attempt to re-establish the WebSocket connection.

```javascript
const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
  realtime: {
    heartbeatCallback: (status) => {
      if (status === 'disconnected') {
        // Explicitly reconnect when heartbeat fails or connection drops
        client.connect()
      }
    },
  },
})
```

### Step 2: Enable Web workers for reliable background heartbeats

Enabling the Web Worker option helps prevent browser throttling from affecting your Realtime connection's heartbeat mechanism.

- **Purpose:** To ensure that heartbeat signals are sent consistently even when your application is running in the background, thereby preventing silent disconnections caused by browser throttling.
- **How it works:** By setting `worker: true` in your Realtime client configuration, the heartbeat logic is offloaded to a **Web Worker**. Since Web Workers run in a separate thread, they are generally less susceptible to browser throttling than JavaScript execution on the main thread of an inactive tab. This allows heartbeats to be sent reliably in the background, keeping the WebSocket connection alive.

```javascript
const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
  realtime: {
    worker: true,
  },
})
```

### Recommendation: Combine both solutions for maximum stability

For the most robust Realtime connection management, it is strongly recommended to combine both the `heartbeatCallback` and the `worker: true` options.

- The `worker: true` option acts as a primary preventative measure, largely mitigating the risk of disconnections due to browser throttling in background tabs. It ensures that the heartbeats are sent reliably.
- The `heartbeatCallback` serves as a crucial fallback and monitoring mechanism. It allows your application to detect and react to any disconnections that might still occur due to other factors, such as network instability, ensuring that the client can always attempt to re-establish the connection.
