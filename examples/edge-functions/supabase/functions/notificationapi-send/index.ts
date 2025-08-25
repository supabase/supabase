import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import notificationapi from 'npm:notificationapi-node-server-sdk'

// Initialize NotificationAPI with credentials from environment variables
const clientId = Deno.env.get('NOTIFICATIONAPI_CLIENT_ID')
const clientSecret = Deno.env.get('NOTIFICATIONAPI_CLIENT_SECRET')

if (!clientId || !clientSecret) {
  throw new Error(
    'NOTIFICATIONAPI_CLIENT_ID and NOTIFICATIONAPI_CLIENT_SECRET environment variables are required'
  )
}

notificationapi.init(clientId, clientSecret)

serve(async (req) => {
  try {
    const { type, email, parameters } = await req.json()

    await notificationapi.send({
      type: type,
      to: {
        id: email,
        email: email,
      },
      parameters: parameters,
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notification sent successfully',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
})
