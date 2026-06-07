import { bff } from '@/lib/console-bff'

// [console fork] Physical backups / PITR require WAL archiving, which shared-infra
// projects don't run (upstream self-hosting dropped it too). Return a clear message
// instead of a generic API error; logical backups (download/restore) are the path.
export default bff({
  POST: async (_req, res) =>
    res.status(400).json({ error: { message: 'Physical backups & PITR are not available on shared infrastructure. Use logical backups (download / restore).' } }),
})
