import type { FederatedReferenceSource } from '../types'

// Definitions are published by the library repo itself, on main.
const server: FederatedReferenceSource = {
  org: 'supabase',
  repo: 'server',
  versions: [
    {
      path: 'server',
      ref: { branch: 'main' },
      definitionsDir: 'docs/reference-beta/definitions',
      // Remove once supabase/server publishes definitions on main. Until then
      // the examples committed under content/reference-beta/server/definitions
      // are kept.
      optional: true,
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
