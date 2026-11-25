import type { FederatedReferenceSource } from '../types'

// Definitions are published by the CLI repo itself.
const cli: FederatedReferenceSource = {
  org: 'supabase',
  repo: 'cli',
  versions: [
    {
      path: 'cli',
      // TODO: temporary branch, point back to `main` once the definitions are
      // merged there.
      ref: { branch: 'avallete/cli-reference-beta-definitions' },
      definitionsDir: 'apps/cli/docs/reference-beta/definitions',
    },
  ],
}

export default cli
