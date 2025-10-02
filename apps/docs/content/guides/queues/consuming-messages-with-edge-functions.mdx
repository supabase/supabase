---
title: Consuming Supabase Queue Messages with Edge Functions
subtitle: 'Learn how to consume Supabase Queue messages server-side with a Supabase Edge Function'
---

This guide helps you read & process queue messages server-side with a Supabase Edge Function. Read [Queues API Reference](/docs/guides/queues/api) for more details on our API.

## Concepts

Supabase Queues is a pull-based Message Queue consisting of three main components: Queues, Messages, and Queue Types. You should already be familiar with the [Queues Quickstart](/docs/guides/queues/quickstart).

### Consuming messages in an Edge Function

This is a Supabase Edge Function that reads 5 messages off the queue, processes each of them, and deletes each message when it is done.

```tsx
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = 'supabaseURL'
const supabaseKey = 'supabaseKey'

const supabase = createClient(supabaseUrl, supabaseKey)
const queueName = 'your_queue_name'

// Type definition for queue messages
interface QueueMessage {
  msg_id: bigint
  read_ct: number
  vt: string
  enqueued_at: string
  message: any
}

async function processMessage(message: QueueMessage) {
  //
  // Do whatever logic you need to with the message content
  //
  // Delete the message from the queue
  const { error: deleteError } = await supabase.schema('pgmq_public').rpc('delete', {
    queue_name: queueName,
    msg_id: message.msg_id,
  })

  if (deleteError) {
    console.error(`Failed to delete message ${message.msg_id}:`, deleteError)
  } else {
    console.log(`Message ${message.msg_id} deleted from queue`)
  }
}

Deno.serve(async (req) => {
  const { data: messages, error } = await supabase.schema('pgmq_public').rpc('read', {
    queue_name: queueName,
    sleep_seconds: 0, // Don't wait if queue is empty
    n: 5, // Read 5 messages off the queue
  })

  if (error) {
    console.error(`Error reading from ${queueName} queue:`, error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!messages || messages.length === 0) {
    console.log('No messages in workflow_messages queue')
    return new Response(JSON.stringify({ message: 'No messages in queue' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  console.log(`Found ${messages.length} messages to process`)

  // Process each message that was read off the queue
  for (const message of messages) {
    try {
      await processMessage(message as QueueMessage)
    } catch (error) {
      console.error(`Error processing message ${message.msg_id}:`, error)
    }
  }

  // Return immediately while background processing continues
  return new Response(
    JSON.stringify({
      message: `Processing ${messages.length} messages in background`,
      count: messages.length,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  )
})
```

Every time this Edge Function is run it:

1. Read 5 messages off the queue
2. Call the `processMessage` function
3. At the end of `processMessage`, the message is deleted from the queue
4. If `processMessage` throws an error, the error is logged. In this case, the message is still in the queue, so the next time this Edge Function runs it reads the message again.

You might find this kind of setup handy to run with [Supabase Cron](/docs/guides/cron). You can set up Cron so that every N number of minutes or seconds, the Edge Function will run and process a number of messages off the queue.

Similarly, you can invoke the Edge Function on command at any given time with [`supabase.functions.invoke`](/docs/guides/functions/quickstart-dashboard#usage).
