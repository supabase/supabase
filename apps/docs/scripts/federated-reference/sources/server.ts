import type { FederatedReferenceSource } from '../types'

// Definitions are published by the library repo itself.
const server: FederatedReferenceSource = {
  org: 'supabase',
  repo: 'server',
  versions: [
    {
      path: 'server',
      // TODO: temporary branch, point back to `main` once the definitions are
      // merged there.
      ref: { branch: 'jeremias/reference-beta' },
      definitionsDir: 'docs/reference-beta/definitions',
    },
    // An older version would be its own entry, pinned to a tag and mounted at
    // its own route (with its own index.md):
    // {
    //   path: 'server/v0',
    //   ref: { tag: 'v0.9.0' },
    //   definitionsDir: 'docs/reference-beta/definitions',
    // },
  ],
}

export default server
