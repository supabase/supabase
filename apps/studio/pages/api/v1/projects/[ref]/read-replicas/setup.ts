import { bff } from '@/lib/console-bff'

// [console fork] Read replicas require a dedicated (AWS/EC2) primary and live
// streaming replication, which isn't provisioned on shared infrastructure. Return a
// clear message rather than a raw error. (Tracked as a dedicated follow-up.)
export default bff({
  POST: async (_req, res) =>
    res.status(400).json({
      message:
        'Read replicas require a dedicated (AWS/EC2) project with streaming replication. They are not available for shared-infrastructure projects.',
    }),
})
