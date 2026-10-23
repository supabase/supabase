import { withSupabase } from 'npm:@supabase/server@^1'

const msg = new TextEncoder().encode('data: hello\r\n\r\n')

// Authenticated endpoint, so deploy with verify_jwt = true.
export default {
  fetch: withSupabase({ auth: 'user' }, (req, ctx) => {
    let timerId: number | undefined

    const body = new ReadableStream({
      start(controller) {
        timerId = setInterval(() => {
          controller.enqueue(msg)
        }, 1000)
      },
      cancel() {
        if (typeof timerId === 'number') {
          clearInterval(timerId)
        }
      },
    })

    return new Response(body, {
      headers: {
        'Content-Type': 'text/event-stream',
      },
    })
  }),
}
