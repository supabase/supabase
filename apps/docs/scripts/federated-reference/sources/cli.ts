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
      ref: { branch: 'mdonnalley/reference-beta-output' },
      definitionsDir: 'docs/reference-beta/definitions',
    },
  ],
}

export default cli
