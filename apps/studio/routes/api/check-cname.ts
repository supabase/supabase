import { createFileRoute } from '@tanstack/react-router'

import { CheckCNAMERecordResponse } from '@/data/custom-domains/check-cname-mutation'
import { createApiHandlers } from '@/lib/api/apiWrapper'

export const Route = createFileRoute('/api/check-cname')({
  server: {
    handlers: createApiHandlers({
      GET: async ({ request }) => {
        const domain = new URL(request.url).searchParams.get('domain')

        try {
          const result: CheckCNAMERecordResponse = await fetch(
            `https://cloudflare-dns.com/dns-query?name=${domain}&type=CNAME`,
            {
              method: 'GET',
              headers: { Accept: 'application/dns-json' },
            }
          ).then((res) => res.json())
          return Response.json(result, { status: 200 })
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          return Response.json({ message }, { status: 400 })
        }
      },
    }),
  },
})
