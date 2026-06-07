import { bff } from '@/lib/console-bff'

// [console fork] S3 access keys for Storage. Not modeled on shared infra.
export default bff({
  GET: async (_req, res) => res.status(200).json({ data: [] }),
  POST: async (_req, res) => res.status(400).json({ error: { message: 'S3 credentials are not available on shared infrastructure' } }),
})
