import { bff } from '@/lib/console-bff'

// [console fork] Schema diff between a preview branch and production. Migration
// diffing isn't implemented for self-host yet, so we return an empty diff
// (text/plain) — the dashboard treats this as "no changes".
export default bff({
  GET: async (_req, res) => {
    res.setHeader('Content-Type', 'text/plain')
    return res.status(200).send('')
  },
})
