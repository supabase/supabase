import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'

export const Route = createFileRoute('/api/get-ip-address')({
  server: {
    handlers: createApiHandlers({
      GET: ({ request }) => {
        let ipAddress = request.headers.get('x-real-ip') ?? undefined

        const forwardedFor = request.headers.get('x-forwarded-for')

        // With CF infront, the user IP will be in this header instead of the x-forwared-for
        const cfConnectingIp = request.headers.get('cf-connecting-ip')
        if (cfConnectingIp) {
          ipAddress = cfConnectingIp.split(',').at(0) ?? 'Unknown'
        } else if (!ipAddress && forwardedFor) {
          ipAddress = forwardedFor.split(',').at(0) ?? 'Unknown'
        }

        return Response.json({ ipAddress })
      },
    }),
  },
})
