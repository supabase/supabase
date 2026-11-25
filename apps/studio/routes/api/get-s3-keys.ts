import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'

const accessKey = process.env.S3_PROTOCOL_ACCESS_KEY_ID
const secretKey = process.env.S3_PROTOCOL_ACCESS_KEY_SECRET

export const Route = createFileRoute('/api/get-s3-keys')({
  server: {
    handlers: createApiHandlers({
      GET: () => Response.json({ accessKey, secretKey }, { status: 200 }),
    }),
  },
})
