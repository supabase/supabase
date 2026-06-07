import { bff } from '@/lib/console-bff'

// [console fork] No external feature-flag service; return an empty flag set.
export default bff({
  GET: async (_req, res) => res.status(200).json({}),
})
