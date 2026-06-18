---
title: Quickstart
subtitle: 'Learn how to use Supabase Queues to add and read messages'
---

This guide is an introduction to interacting with Supabase Queues via the Dashboard and official client library. Check out [Queues API Reference](/docs/guides/queues/api) for more details on our API.

## Concepts

Supabase Queues is a pull-based Message Queue consisting of three main components: Queues, Messages, and Queue Types.

### Pull-Based Queue

A pull-based Queue is a Message storage and delivery system where consumers actively fetch Messages when they're ready to process them - similar to constantly refreshing a webpage to display the latest updates. Our pull-based Queues process Messages in a First-In-First-Out (FIFO) manner without priority levels.

### Message

A Message in a Queue is a JSON object that is stored until a consumer explicitly processes and removes it, like a task waiting in a to-do list until someone checks and completes it.

### Queue types

Supabase Queues offers three types of Queues:

- **Basic Queue**: A durable Queue that stores Messages in a logged table.
- **Unlogged Queue**: A transient Queue that stores Messages in an unlogged table for better performance but may result in loss of Queue Messages.

## Create Queues

To get started, navigate to the [Supabase Queues](/dashboard/project/_/integrations/queues/overview) Postgres Module under Integrations in the Dashboard and enable the `pgmq` extension.

<Admonition type="note">

`pgmq` extension is available in Postgres version 15.6.1.143 or later.

</Admonition>

<Image
  alt="Supabase Dashboard Integrations page, showing the Queues Postgres Module"
  src={{
    dark: '/docs/img/queues-quickstart-install-dark.png',
    light: '/docs/img/queues-quickstart-install-light.png',
  }}

width={2064}
height={1720}
/>

On the [Queues page](/dashboard/project/_/integrations/queues/queues):

- Click **Create queue** button

- Name your queue

<Admonition type="tip">

Queue names can only be lowercase and hyphens and underscores are permitted.

</Admonition>

- Select your [Queue Type](#queue-types)
- We recommend leaving Row Level Security (RLS) enabled. With it enabled, you don't need to set additional RLS on the queue tables.

<Image
  alt="A screenshot showing the process to create a Queue from the Supabase Dashboard"
  src={{
    dark: '/docs/img/queues-quickstart-create-dark.png',
    light: '/docs/img/queues-quickstart-create-light.png',
  }}

className="max-w-lg mx-auto!"

width={1456}
height={1420}
/>

<Admonition type="tip" title="What happens when you create a queue?">

Every new Queue creates two tables in the `pgmq` schema. These tables are `pgmq.q_<queue_name>` to store and process active messages and `pgmq.a_<queue_name>` to store any archived messages.

A "Basic Queue" creates `pgmq.q_<queue_name>` and `pgmq.a_<queue_name>` tables as logged tables.

However, an "Unlogged Queue" creates `pgmq.q_<queue_name>` as an unlogged table for better performance while sacrificing durability. The `pgmq.a_<queue_name>` table is still created as a logged table so your archived messages remain safe and secure.

</Admonition>

## Expose Queues to client-side consumers

Queues, by default, are not exposed over the Supabase Data API and are only accessible via Postgres clients.

However, you may grant client-side consumers access to your Queues by enabling the Supabase Data API and granting permissions to the Queues API, which is a collection of database functions in the `pgmq_public` schema that wraps the database functions in the `pgmq` schema.

This is to prevent direct access to the `pgmq` schema and its tables (RLS is not enabled by default on any tables) and database functions.

To get started, navigate to the [**Queues > Settings**](/dashboard/project/_/integrations/queues/settings) section of the Dashboard and enable **Expose Queues via PostgREST**. Once enabled, Supabase creates and exposes a `pgmq_public` schema containing database function wrappers to a subset of `pgmq`'s database functions.

### Add an RLS policy on your tables in `pgmq` schema [#enable-rls-on-your-tables-in-pgmq-schema]

If you expose your pgmq schema with the Data API, for security purposes, you must enable Row Level Security (RLS) on all Queue tables (all tables in `pgmq` schema that begin with `q_`)

Add an RLS policy for any Queues you want your client-side consumers to interact with, by clicking the _Add RLS Policy_ button on [the overview page of any Queue in the Dashboard](/dashboard/project/_/integrations/queues/queues).

### Grant permissions to `pgmq_public` database functions

On top of enabling RLS and writing RLS policies on the underlying Queue tables, you must grant the correct permissions to the `pgmq_public` database functions for each Data API role.

The permissions required for each Queue API database function:

| **Operations**      | **Permissions Required** |
| ------------------- | ------------------------ |
| `send` `send_batch` | `Select` `Insert`        |
| `read` `pop`        | `Select` `Update`        |
| `archive` `delete`  | `Select` `Delete`        |

To manage your queue permissions, click on the Queue Settings cog button on [the overview page of any Queue in the Dashboard](/dashboard/project/_/integrations/queues/queues).

<Image
  alt="Screenshot highlighting the Queue Settings button on the Queues overview page in the Supabase Dashboard"
  src={{
    dark: '/docs/img/queues-quickstart-queue-settings-dark.png',
    light: '/docs/img/queues-quickstart-queue-settings-light.png',
  }}

width={2150}
height={1192}
/>

Then enable the required roles permissions.

| ROLE          | Select  | Insert  | Update  | Delete  |
| ------------- | ------- | ------- | ------- | ------- |
| anon          |         |         |         |         |
| authenticated | enabled | enabled | enabled | enabled |
| postgres      | enabled | enabled | enabled | enabled |
| service_role  | enabled | enabled | enabled | enabled |

<Admonition type="caution">

You should never expose `postgres` and `service_role` roles client-side.

</Admonition>

### Enqueueing and dequeueing messages

Once you have created your Queue, you can begin enqueueing and dequeueing Messages.

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="js"
  queryGroup="language"
>
<TabPanel id="js" label="JavaScript">

```tsx
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'supabaseURL'
const supabaseKey = 'supabaseKey'

const supabase = createClient(supabaseUrl, supabaseKey)

const QueuesTest: React.FC = () => {
  //Add a Message
  const sendToQueue = async () => {
    const result = await supabase.schema('pgmq_public').rpc('send', {
      queue_name: 'foo',
      message: { hello: 'world' },
      sleep_seconds: 30,
    })
    console.log(result)
  }

  //Dequeue Message
  const popFromQueue = async () => {
    const result = await supabase.schema('pgmq_public').rpc('pop', { queue_name: 'foo' })
    console.log(result)
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Queue Test Component</h2>
      <button
        onClick={sendToQueue}
        className="bg-blue-500 text-white px-4 py-2 rounded-sm hover:bg-blue-600 mr-4"
      >
        Add Message
      </button>
      <button
        onClick={popFromQueue}
        className="bg-blue-500 text-white px-4 py-2 rounded-sm hover:bg-blue-600"
      >
        Pop Message
      </button>
    </div>
  )
}

export default QueuesTest
```

</TabPanel>
<$Show if="sdk:dart">
<TabPanel id="dart" label="Dart">

```dart
import 'package:supabase_flutter/supabase_flutter.dart';

final supabase = Supabase.instance.client;

// Add a Message
Future<void> sendToQueue() async {
  final result = await supabase.schema('pgmq_public').rpc('send', params: {
    'queue_name': 'foo',
    'message': {'hello': 'world'},
    'sleep_seconds': 30,
  });
  print(result);
}

// Dequeue Message
Future<void> popFromQueue() async {
  final result = await supabase.schema('pgmq_public').rpc('pop', params: {
    'queue_name': 'foo',
  });
  print(result);
}
```

</TabPanel>
</$Show>
<$Show if="sdk:swift">
<TabPanel id="swift" label="Swift">

```swift
import Supabase

let supabase = SupabaseClient(
  supabaseURL: URL(string: "supabaseURL")!,
  supabaseKey: "supabaseKey"
)

// Add a Message
func sendToQueue() async throws {
  let result = try await supabase
    .schema("pgmq_public")
    .rpc("send", params: [
      "queue_name": AnyJSON.string("foo"),
      "message": AnyJSON.object(["hello": "world"]),
      "sleep_seconds": AnyJSON.integer(30)
    ])
    .execute()
  print(result)
}

// Dequeue Message
func popFromQueue() async throws {
  let result = try await supabase
    .schema("pgmq_public")
    .rpc("pop", params: ["queue_name": "foo"])
    .execute()
  print(result)
}
```

</TabPanel>
</$Show>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
from supabase import create_client, Client

supabase_url = "supabaseURL"
supabase_key = "supabaseKey"

supabase: Client = create_client(supabase_url, supabase_key)

# Add a Message
def send_to_queue():
    result = supabase.schema("pgmq_public").rpc(
        "send",
        {
            "queue_name": "foo",
            "message": {"hello": "world"},
            "sleep_seconds": 30,
        }
    ).execute()
    print(result)

# Dequeue Message
def pop_from_queue():
    result = supabase.schema("pgmq_public").rpc(
        "pop",
        {"queue_name": "foo"}
    ).execute()
    print(result)
```

</TabPanel>
</$Show>
</Tabs>
