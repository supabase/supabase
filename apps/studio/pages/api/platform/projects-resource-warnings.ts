import { bff } from '@/lib/console-bff'

// [console fork] Per-project resource warnings (infra/usage). Not modeled yet;
// return an empty list so the dashboard shows no warnings.
export default bff({
  GET: async (_req, res) => res.status(200).json([]),
})
