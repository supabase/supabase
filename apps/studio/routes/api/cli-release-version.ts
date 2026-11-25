import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'

type GitHubRepositoryRelease = {
  id: number
  url: string
  name: string
  tag_name: string
  published_at: string
}

const current = process.env.CURRENT_CLI_VERSION ? `v${process.env.CURRENT_CLI_VERSION}` : undefined

export const Route = createFileRoute('/api/cli-release-version')({
  server: {
    handlers: createApiHandlers({
      GET: async () => {
        try {
          const { tag_name: latest, published_at }: GitHubRepositoryRelease = await fetch(
            'https://api.github.com/repos/supabase/cli/releases/latest'
          ).then((res) => res.json())

          const data: GitHubRepositoryRelease[] = await fetch(
            'https://api.github.com/repos/supabase/cli/releases?per_page=1'
          )
            .then((res) => res.json())
            // Ignore errors fetching beta release version
            .catch(() => [])
          const beta = data[0]?.tag_name

          return Response.json({ current, latest, beta, published_at }, { status: 200 })
        } catch {
          return Response.json({ current }, { status: 200 })
        }
      },
    }),
  },
})
