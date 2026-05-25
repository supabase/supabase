import { describe, expect, it } from 'vitest'

import { buildFilePathTree } from './file-tree'

describe('buildFilePathTree', () => {
  it('nests file paths into directory branches', () => {
    const tree = buildFilePathTree([
      'supabase/schemas/public/table.sql',
      'supabase/config.toml',
      'README.md',
    ])

    expect(tree.children).toEqual([
      { name: 'README.md', metadata: { path: 'README.md' } },
      {
        name: 'supabase',
        children: [
          { name: 'config.toml', metadata: { path: 'supabase/config.toml' } },
          {
            name: 'schemas',
            children: [
              {
                name: 'public',
                children: [
                  {
                    name: 'table.sql',
                    metadata: { path: 'supabase/schemas/public/table.sql' },
                  },
                ],
              },
            ],
          },
        ],
      },
    ])
  })
})
