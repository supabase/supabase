---
id: 'protocol'
title: 'Realtime Protocol'
description: 'Understanding Realtime Protocol'
---

## WebSocket connection setup

To start the connection we use the WebSocket URL, which for:

- Supabase projects: `wss://<PROJECT_REF>.supabase.co/realtime/v1/websocket?apikey=<API_KEY>`
- self-hosted projects: `wss://<HOST>:<PORT>/socket/websocket?apikey=<API_KEY>`

{/* supa-mdx-lint-disable-next-line Rule003Spelling */}
As an example, using [websocat](https://github.com/vi/websocat), you would run the following command in your terminal:

```bash
# With Supabase
websocat "wss://<PROJECT_REF>.supabase.co/realtime/v1/websocket?apikey=<API_KEY>"

# With self-hosted
websocat "wss://<HOST>:<PORT>/socket/websocket?apikey=<API_KEY>"
```

During this stage you can also set other URL params:

- `vsn`: sets the protocol version. Possible values are `1.0.0` and `2.0.0`. Defaults to `1.0.0`.
- `log_level`: sets the log level to be used by this connection to help you debug potential issues. This only affects server side logs.

After connecting a `phx_join` event must be sent to the server to join a channel. The next sections outline the different messages types and events that are supported.

## Protocol messages

Messages can be serialized in different formats. The Realtime protocol supports two versions: `1.0.0` and `2.0.0`.

## 1.0.0

Version 1.0.0 is extremely simple. It uses JSON as the serialization format for messages. The underlying WebSocket messages are all text frames.

Messages contain the following fields:

- `event`: The type of event being sent or received. Example `phx_join`, `postgres_changes`, `broadcast`, etc.
- `topic`: The topic to which the message belongs. This is a string that identifies the channel or context of the message.
- `payload`: The data associated with the event. This can be any JSON-serializable data structure, such as an object or an array.
- `ref`: A unique reference ID for the message. This is useful to track replies to a specific message.
- `join_ref`: A unique reference ID to uniquely identify a joined topic for pushes, broadcasts, replies, etc.

Example:

```json
{
  "topic": "realtime:presence-room",
  "event": "phx_join",
  "payload": {
    "config": {
      "broadcast": {
        "ack": false,
        "self": false
      },
      "presence": {
        "enabled": false
      },
      "private": false
    }
  },
  "ref": "1",
  "join_ref": "1"
}
```

## 2.0.0

Version 2.0.0 uses text and binary WebSocket frames.

### Text frames

Text frames are always JSON encoded, but unlike version 1.0.0, they use a JSON array where the element order must be exactly:

- `join_ref`
- `ref`
- `topic`
- `event`
- `payload`

Example:

```json
[
  "1",
  "1",
  "realtime:presence-room",
  "phx_join",
  {
    "config": {
      "broadcast": {
        "ack": false,
        "self": false
      },
      "presence": {
        "enabled": false
      },
      "private": false
    }
  }
]
```

### Binary frames

The two special message types have a well defined binary format where the first byte defines the type of message. Both are used to send and receive broadcast events. See the [client](#client-sent-events) and [server](#server-sent-events) sent events for more details.

| Code | Type                | Description                   |
| ---- | ------------------- | ----------------------------- |
| 3    | USER_BROADCAST_PUSH | User-initiated broadcast push |
| 4    | USER_BROADCAST      | User broadcast message        |

{/* supa-mdx-lint-disable-next-line Rule001HeadingCase */}

#### User Broadcast Push

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  Type (0x03)  | Join Ref Size |   Ref Size    |  Topic Size   |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|User Event Size| Metadata Size | Payload Enc.  |  Join Ref ... |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                      Ref (variable length)                    |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                     Topic (variable length)                   |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                  User Event (variable length)                 |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                   Metadata (variable length)                  |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                User Payload (variable length)                 |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

**Field Descriptions:**

- **Type**: 1 byte, value = 0x03
- **Join Ref Size**: 1 byte, size of join reference string (max 255)
- **Ref Size**: 1 byte, size of reference string (max 255)
- **Topic Size**: 1 byte, size of topic string (max 255)
- **User Event Size**: 1 byte, size of user event string (max 255)
- **Metadata Size**: 1 byte, size of metadata string (max 255)
- **Payload Encoding**: 1 byte (0 = binary, 1 = JSON)
- **Join Ref**: Variable length string
- **Ref**: Variable length string
- **Topic**: Variable length string
- **User Event**: Variable length string
- **Metadata**: Variable length JSON string
- **User Payload**: Variable length payload data

#### User Broadcast

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  Type (0x04)  |  Topic Size   |User Event Size| Metadata Size |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
| Payload Enc.  |          Topic (variable length)              |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                  User Event (variable length)                 |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                   Metadata (variable length)                  |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                User Payload (variable length)                 |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

**Field Descriptions:**

- **Type**: 1 byte, value = 0x04
- **Topic Size**: 1 byte, size of topic string (max 255)
- **User Event Size**: 1 byte, size of user event string (max 255)
- **Metadata Size**: 1 byte, size of metadata JSON string (max 255)
- **Payload Encoding**: 1 byte (0 = binary, 1 = JSON)
- **Topic**: Variable length string
- **User Event**: Variable length string
- **Metadata**: Variable length JSON string
- **User Payload**: Variable length payload data

## Event types

Messages for all events are encoded as text frames using JSON except with the `broadcast` event type which can happen on both text and binary frames.

### Client sent events

| Event Type     | Description                                              | Requires Ref | Requires Join Ref |
| -------------- | -------------------------------------------------------- | ------------ | ----------------- |
| `phx_join`     | Initial message to join a channel and configure features | ✅           | ✅                |
| `phx_leave`    | Message to leave a channel                               | ✅           | ✅                |
| `heartbeat`    | Heartbeat message to keep the connection alive           | ✅           | ⛔                |
| `access_token` | Message to update the access token                       | ✅           | ✅                |
| `broadcast`    | Broadcast message sent to all clients in a channel       | ✅           | ✅                |
| `presence`     | Presence state update sent after joining a channel       | ✅           | ✅                |

{/* supa-mdx-lint-disable-next-line Rule001HeadingCase */}

#### phx_join

This is the initial message required to join a channel. The client sends this message to the server to join a specific topic and configure the features it wants to use, such as Postgres changes, Presence, and Broadcast. The payload of the `phx_join` event contains the configuration options for the channel.

```ts
{
  "config": {
    "broadcast": {
      "ack": boolean,
      "self": boolean,
      "replay" : {
        "since": integer,
        "limit": integer
      }
    },
    "presence": {
      "enabled": boolean,
      "key": string
    },
    "postgres_changes": [
      {
        "event": string,
        "schema": string,
        "table": string,
        "filter": string
      }
    ]
    "private": boolean
  },
  "access_token": string
}
```

- `config`:
  - `private`: Whether the channel is private
  - `broadcast`: Configuration options for broadcasting messages
    - `ack`: Acknowledge broadcast messages
    - `self`: Include the sender in broadcast messages
    - `replay`: Configuration options for broadcast replay (Optional)
      - `since`: Replay messages since a specific timestamp in milliseconds
      - `limit`: Limit the number of replayed messages (Optional)
  - `presence`: Configuration options for presence tracking
    - `enabled`: Whether presence tracking is enabled for this channel
    - `key`: Key to be used for presence tracking, if not specified or empty, a UUID will be generated and used
  - `postgres_changes`: Array of configurations for Postgres changes
    - `event`: Database change event to listen to, accepts `INSERT`, `UPDATE`, `DELETE`, or `*` to listen to all events.
    - `schema`: Schema of the table to listen to, accepts `*` wildcard to listen to all schemas
    - `table`: Table of the database to listen to, accepts `*` wildcard to listen to all tables
    - `filter`: Filter to be used when pulling changes from database. Read more about filters in the usage docs for [Postgres Changes](/docs/guides/realtime/postgres-changes?queryGroups=language&language=js#filtering-for-specific-changes)
- `access_token`: Optional access token for authentication, if not provided, the server will use the API key.

Example on protocol version `2.0.0`:

```json
[
  "3",
  "5",
  "realtime:chat-room",
  "phx_join",
  {
    "config": {
      "broadcast": {
        "ack": false,
        "self": true,
        "replay": {
          "since": 1763407103911,
          "limit": 10
        }
      },
      "presence": {
        "key": "user_id-827",
        "enabled": true
      },
      "postgres_changes": [],
      "private": true
    }
  }
]
```

{/* supa-mdx-lint-disable-next-line Rule001HeadingCase */}

#### phx_leave

This message is sent by the client to leave a channel. It can be used to clean up resources or stop listening for events on that channel. Payload should be empty object.

Example on protocol version `2.0.0`:

```json
["1", "3", "realtime:avatar-stack-demo", "phx_leave", {}]
```

{/* supa-mdx-lint-disable-next-line Rule001HeadingCase */}

#### heartbeat

The heartbeat message should be sent at least every 25 seconds to avoid a connection timeout. Payload should be an empty object.

For heartbeat, the topic `phoenix` is used as this special message is not connected to a specific channel.

Example on protocol version `2.0.0`:

```json
[null, "26", "phoenix", "heartbeat", {}]
```

{/* supa-mdx-lint-disable-next-line Rule001HeadingCase */}

#### access_token

Used to setup a new token to be used by Realtime for authentication and to refresh the token to prevent a private channel from closing when the token expires.

```ts
{
   "access_token": string
}
```

- `access_token`: The new access token to be used for authentication. Either to change it or to refresh it.

Example on protocol version `2.0.0`:

```json
[
  "10",
  "1",
  "realtime:chat-room",
  "access_token",
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30"
  }
]
```

{/* supa-mdx-lint-disable-next-line Rule001HeadingCase */}

#### broadcast (text frame)

Used to send a broadcast event to all clients in a channel.

The `payload` field contains the event name and the data to broadcast.

```ts
{
   "event": string,
   "payload": json,
   "type": "broadcast"
}
```

- `event`: The name of the user event to broadcast.
- `payload`: The user data associated with the event, which can be any JSON-serializable data structure.
- `type`: The type of message, which must always be `broadcast`.

Example on protocol version `2.0.0`:

```json
[
  "10",
  "1",
  "realtime:chat-room",
  "broadcast",
  {
    "event": "user-event",
    "type": "broadcast",
    "payload": {
      "content": "Hello, World!",
      "createdAt": "2025-11-17T21:14:14Z",
      "id": "9b823349-71c0-465b-9a83-a63aa2a9ae6d",
      "username": "VCSHLD556nQD-B-vUTJJ3"
    }
  }
]
```

{/* supa-mdx-lint-disable-next-line Rule001HeadingCase */}

#### broadcast (binary frame)

See the [User Broadcast Push](#user-broadcast-push) section for the binary frame structure.

This message is a streamlined version of the text frame broadcast event that also supports non-JSON payloads.
Below is the same example from the previous section, showing the binary frame structure with hexadecimal values for the header and plain text for the remaining fields:

- Join Ref: `10`
- Ref: `1`
- Topic: `realtime:chat-room`
- Payload encoding being JSON
- User Event: `user-event`
- Metadata is empty
- User Payload

```
0x03                      // Type
0x02                      // Join Ref Size
0x01                      // Ref Size
0x12                      // Topic Size
0x0A                      // User Event Size
0x00                      // Metadata Size
0x01                      // Payload Encoding (1 = JSON)
10                        // Actual Join Ref
1                         // Actual Ref
realtime:chat-room        // Topic
user-event                // User Event
{                         // User Event Payload
  "content": "Hello, World!",
  "createdAt": "2025-11-17T21:14:14Z",
  "id": "9b823349-71c0-465b-9a83-a63aa2a9ae6d",
  "username": "VCSHLD556nQD-B-vUTJJ3"
}
```

The payload encoding is just a hint for the client to know if the payload should be treated as JSON or not.

{/* supa-mdx-lint-disable-next-line Rule001HeadingCase */}

#### presence

Used to send presence metadata after joining a channel. The payload contains the presence information to be tracked by the server.
This metadata is then sent back to all clients in the channel via `presence_state` and `presence_diff` events.

```ts
{
   "type": "presence",
   "event": "track",
   "payload": json
}
```

Example on protocol version `2.0.0`:

```json
[
  "1",
  "5",
  "realtime:presence-room",
  "presence",
  {
    "type": "presence",
    "event": "track",
    "payload": {
      "name": "Alice",
      "color": "hsl(29, 100%, 70%)"
    }
  }
]
```

### Server sent events

| Event Type         | Description                                                             | Requires Ref | Requires Join Ref |
| ------------------ | ----------------------------------------------------------------------- | ------------ | ----------------- |
| `phx_close`        | Message from server to signal channel closed                            | ✅           | ✅                |
| `phx_error`        | Error message sent by the server when an error occurs                   | ✅           | ✅                |
| `phx_reply`        | Response to a `phx_join` or other requests                              | ✅           | ✅\*              |
| `system`           | System messages to inform about the status of the Postgres subscription | ⛔           | ⛔                |
| `broadcast`        | Broadcast message sent to all clients in a channel                      | ⛔           | ⛔                |
| `presence_state`   | Presence state sent by the server on join                               | ⛔           | ⛔                |
| `presence_diff`    | Presence state diff update sent after a change in presence state        | ⛔           | ⛔                |
| `postgres_changes` | Postgres CDC message containing changes to the database                 | ⛔           | ⛔                |

{/* supa-mdx-lint-disable-next-line Rule001HeadingCase */}

#### phx_close

This message is sent by the server to signal that the channel has been closed. Payload will be empty object.

Example on protocol version `2.0.0`:

```json
["3", "3", "realtime:avatar-stack-demo", "phx_close", {}]
```

{/* supa-mdx-lint-disable-next-line Rule001HeadingCase */}

#### phx_error

This message is sent by the server when an unexpected error occurs in the channel. Payload will be an empty object

```json
["3", "3", "realtime:avatar-stack-demo", "phx_error", {}]
```

{/* supa-mdx-lint-disable-next-line Rule001HeadingCase */}

#### phx_reply

The server sends these messages in response to client requests that require acknowledgment.

```ts
{
   "status": string,
   "response": any,
}
```

- `status`: The status of the response, can be `ok` or `error`.
- `response`: The response data, which can vary based on the event that was replied to

`phx_join` has a specific response structure outlined below.

Contains the status of the join request and any additional information requested in the `phx_join` payload.

```ts
{
   "postgres_changes": [
      {
         "id": number,
         "event": string,
         "schema": string,
         "table": string
      }
   ]
}
```

- `postgres_changes`: Array of Postgres changes that the client is subscribed to, each object contains:
  - `id`: Unique identifier for the Postgres changes subscription
  - `event`: The type of event the client is subscribed to, such as `INSERT`, `UPDATE`, `DELETE`, or `*`
  - `schema`: The schema of the table the client is subscribed to
  - `table`: The table the client is subscribed to

Example on protocol version `2.0.0`:

```json
[
  "1",
  "1",
  "realtime:chat-room",
  "phx_reply",
  {
    "status": "ok",
    "response": {
      "postgres_changes": [
        {
          "id": 106243155,
          "event": "*",
          "schema": "public",
          "table": "test"
        }
      ]
    }
  }
]
```

{/* supa-mdx-lint-disable-next-line Rule001HeadingCase */}

#### system

The server sends system messages to inform clients about the status of their Realtime channel subscriptions.

```ts
{
   "message": string,
   "status": string,
   "extension": string,
   "channel": string
}
```

- `message`: A human-readable message describing the status of the subscription.
- `status`: The status of the subscription, can be `ok`, `error`, or `timeout`.
- `extension`: The extension that sent the message.
- `channel`: The channel to which the message belongs, such as `realtime:room1`.

Example on protocol version `2.0.0`:

```json
[
  "13",
  null,
  "realtime:chat-room",
  "system",
  {
    "message": "Subscribed to PostgreSQL",
    "status": "ok",
    "extension": "postgres_changes",
    "channel": "main"
  }
]
```

{/* supa-mdx-lint-disable-next-line Rule001HeadingCase */}

#### broadcast (text frame)

{/* supa-mdx-lint-disable-next-line Rule003Spelling */}

This is the structure of broadcast events received by all clients subscribed to a channel. The `payload` field contains the event name and data that was broadcasted.

```ts
{
  "event": string,
  "meta" : {
    "id" : uuid,
    "replayed" : boolean
  },
  "payload": json,
  "type": "broadcast"
}
```

- `event`: The name of the user event to broadcast.
- `meta`: Metadata about the broadcast message. Not always present.
  - `id`: A unique identifier for the broadcast message in UUID format.
  - `replayed`: A boolean indicating whether the message is a replayed message. Not always present
- `payload`: The user data associated with the event, which can be any JSON-serializable data structure.
- `type`: The type of message, which must always be `broadcast` for broadcast messages.

Example on protocol version `2.0.0`:

```json
[
  null,
  null,
  "realtime:chat-room",
  "broadcast",
  {
    "event": "message",
    "type": "broadcast",
    "meta": {
      "id": "006554ce-d22d-469c-877a-88bef47214a3"
    },
    "payload": {
      "id": "513edcc1-4cbc-4274-aa26-c195f7e8c090",
      "content": "oi",
      "username": "hpK9jN2iY-I2HioHWr5ml",
      "createdAt": "2025-11-18T22:44:29Z"
    }
  }
]
```

{/* supa-mdx-lint-disable-next-line Rule001HeadingCase */}

#### broadcast (binary frame)

See the [User Broadcast](#user-broadcast) section for the binary frame structure.

This message is a streamlined version of the text frame broadcast event that also supports non-JSON payloads.
Below is the same example from the previous section, showing the binary frame structure with hexadecimal values for the header and plain text for the remaining fields:

- Topic: `realtime:chat-room`
- Payload encoding being JSON
- Metadata: `{"id":"006554ce-d22d-469c-877a-88bef47214a3"}`
- User Event: `message`
- User Payload

```
0x04                                          // Type
0x12                                          // Topic Size
0x07                                          // User Event Size
0x2D                                          // Metadata Size
0x01                                          // Payload Encoding (1 = JSON)
realtime:chat-room                            // Topic
message                                       // User Event
{"id":"006554ce-d22d-469c-877a-88bef47214a3"} // Metadata
{                                             // User Event Payload
  "id": "513edcc1-4cbc-4274-aa26-c195f7e8c090",
  "content": "oi",
  "username": "hpK9jN2iY-I2HioHWr5ml",
  "createdAt": "2025-11-18T22:44:29Z"
}
```

The metadata field is JSON encoded. The payload encoding is just a hint for the client to know if the payload should be treated as JSON or not.

{/* supa-mdx-lint-disable-next-line Rule001HeadingCase */}

#### postgres_changes

The server sends this message when a database change occurs in a subscribed schema and table. The payload contains the details of the change, including the schema, table, event type, and the new and old records.

```ts
{
   "ids": [
      number
   ],
   "data": {
      "schema": string,
      "table": string,
      "commit_timestamp": string,
      "type": "*" | "INSERT" | "UPDATE" | "DELETE",
      "columns": [
        {
          "name": string,
          "type": string
        }
      ]
      "record": {
         [key: string]: boolean | number | string | null
      },
      "old_record": {
         [key: string]: boolean | number | string | null
      },
      "errors": string | null
   }
}
```

- `ids`: An array of unique identifiers matching the subscription when joining the channel.
- `data`: An object containing the details of the change:
  - `schema`: The schema of the table where the change occurred.
  - `table`: The table where the change occurred.
  - `commit_timestamp`: The timestamp when the change was committed to the database.
  - `type`: The type of event that occurred, such as `INSERT`, `UPDATE`, `DELETE`, or `*` for all events.
  - `columns`: An array of objects representing the columns of the table, each containing:
    - `name`: The name of the column.
    - `type`: The data type of the column.
  - `record`: An object representing the new values after the change, with keys as column names and values as their corresponding values.
  - `old_record`: An object representing the old values before the change, with keys as column names and values as their corresponding values.
  - `errors`: Any errors that occurred during the change, if applicable.

```json
[
  null,
  null,
  "realtime:chat-room",
  "postgres_changes",
  {
    "ids": [104868189],
    "data": {
      "schema": "public",
      "table": "test",
      "commit_timestamp": "2025-11-19T00:22:40.877Z",
      "type": "UPDATE",
      "columns": [
        {
          "name": "id",
          "type": "int8"
        },
        {
          "name": "created_at",
          "type": "timestamptz"
        },
        {
          "name": "text",
          "type": "text"
        }
      ],
      "record": {
        "id": 46,
        "text": "content",
        "created_at": "2025-11-03T09:32:55+00:00"
      },
      "old_record": {
        "id": 46
      },
      "errors": null
    }
  }
]
```

{/* supa-mdx-lint-disable-next-line Rule001HeadingCase */}

#### presence_state

After joining, the server sends a `presence_state` message to a client with presence information. The payload field contains keys, where each key represents a client and its value is a JSON object containing information about that client. The key is defined by the client when joining the channel. If not specified, a UUID is automatically generated.

```ts
{
   [key: string]: {
      metas: [
         {
            phx_ref: string,
            [key: string]: any
         }
      ]
   }
}
```

- `key`: The client key.
- `metas`: An array of metadata objects for the client, each containing:
  - `phx_ref`: A unique reference ID for the metadata.
  - Any other custom fields defined by the client, such as `name`.

Example on protocol version `2.0.0`:

```json
[
  "4",
  null,
  "realtime:cursor-room",
  "presence_state",
  {
    "2wCojG1xWgxG2ZxwocvSX": {
      "metas": [
        {
          "phx_ref": "GHlA1fShRjMmZhnL",
          "color": "hsl(204, 100%, 70%)",
          "key": "2wCojG1xWgxG2ZxwocvSX"
        }
      ]
    },
    "6eorYR7andHiq-7tCkmxQ": {
      "metas": [
        {
          "phx_ref": "GHk99Q_ez6-GzaeG",
          "color": "hsl(7, 100%, 70%)",
          "key": "6eorYR7andHiq-7tCkmxQ"
        }
      ]
    },
    "FOeQUamq3OLOWAAZK8iH3": {
      "metas": [
        {
          "phx_ref": "GHk-wA8Z61GGzeoG",
          "color": "hsl(212, 100%, 70%)",
          "key": "FOeQUamq3OLOWAAZK8iH3"
        }
      ]
    }
  }
]
```

{/* supa-mdx-lint-disable-next-line Rule001HeadingCase */}

#### presence_diff

After a change to the presence state, such as a client joining or leaving, the server sends a presence_diff message to update the client's view of the presence state. The payload field contains two keys, `joins` and `leaves`, which represent clients that have joined and left, respectively. Each key is either specified by the client when joining the channel or automatically generated as a UUID.

```ts
{
  "joins": {
    [key: string]: {
      metas: [
        {
          phx_ref: string,
          [key: string]: any
        }
      ]
    }
  },
  "leaves": {
    [key: string]: {
      metas: [
        {
          phx_ref: string,
          [key: string]: any
        }
      ]
    }
  }
}
```

- `joins`: An object containing metadata for clients that have joined the channel, with keys as UUIDs and values as metadata objects.
- `leaves`: An object containing metadata for clients that have left the channel, with keys as UUIDs and values as metadata objects.

Example on protocol version `2.0.0`:

```json
[
  null,
  null,
  "realtime:cursor-room",
  "presence_diff",
  {
    "joins": {
      "XnAJXkZVEJuBYZcp9GCG5": {
        "metas": [
          {
            "phx_ref": "GHlE8VLvxuKGzQJN",
            "color": "hsl(60, 100%, 70%)",
            "user": "123"
          }
        ]
      }
    },
    "leaves": {
      "ouCsaiOdKZ9yauoy4x5pv": {
        "metas": [
          {
            "phx_ref": "GHlE8HyhSPAmZgdB",
            "color": "hsl(72, 100%, 70%)",
            "user": "456"
          }
        ]
      }
    }
  }
]
```
