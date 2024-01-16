export const LIBS = [
  {
    // parent
    key: 'nextjs',
    label: 'Next.JS',
    // child === using dropdown
    children: [
      {
        key: 'app',
        label: 'App Router',
        files: [],
        // grandchildren === client dropdown
        grandchildren: [
          {
            key: 'supabasejs',
            label: 'supabase-js',
            files: [
              {
                fileName: 'env.local',
                displayName: '.env.local',
                path: 'nextjs/supabase-js/env.local.tsx',
              },
              {
                fileName: 'client',
                displayName: 'client.tsx',
                path: 'nextjs/supabase-js/client.tsx',
              },
              {
                fileName: 'server',
                displayName: 'server.tsx',
                path: 'nextjs/supabase-js/server.tsx',
              },
              { fileName: 'page', displayName: 'page.tsx', path: 'nextjs/supabase-js/page.tsx' },
            ],
          },
        ],
      },
    ],
  },
  {
    // parent
    key: 'vue',
    label: 'Vue.JS',
    files: [
      {
        fileName: 'env.local',
        displayName: '.env.local',
        path: 'nextjs/supabase-js/env.local.tsx',
      },
      {
        fileName: 'client',
        displayName: 'client.tsx',
        path: 'nextjs/supabase-js/client.tsx',
      },
      {
        fileName: 'server',
        displayName: 'server.tsx',
        path: 'nextjs/supabase-js/server.tsx',
      },
      { fileName: 'page', displayName: 'page.tsx', path: 'nextjs/supabase-js/page.tsx' },
    ],
  },
]
