import { bff } from '@/lib/console-bff'

// [console fork] Org usage summary. No billing on self-host; return an empty,
// non-billed usage set so the page renders "no data" instead of an error.
export default bff({
  GET: async (_req, res) => res.status(200).json({ usage_billing_enabled: false, usages: [] }),
})
