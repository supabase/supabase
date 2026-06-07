import { bff } from '@/lib/console-bff'

// [console fork] Workflow (GitHub Actions) runs. Self-host branch deploys use our
// own job pipeline, not GitHub Actions, so there are no Action runs — return an
// empty list so the "Workflow logs" view shows its empty state instead of erroring.
export default bff({
  GET: async (_req, res) => res.status(200).json([]),
})
