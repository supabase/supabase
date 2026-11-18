import { useQueries } from '@tanstack/react-query'

import { MOCK_ORGANIZATION_PROJECTS } from '@/data/oauth-apps/mocks'
import { projectKeys } from '@/data/projects/keys'

// TODO: temporary hook until we remove mock data
export const useProjectsByRefQuery = (projectRefs: string[]) => {
  return useQueries({
    queries: projectRefs.map((ref) => ({
      queryKey: projectKeys.detail(ref),
      queryFn: () => {
        for (const orgSlug of Object.keys(MOCK_ORGANIZATION_PROJECTS)) {
          const match = MOCK_ORGANIZATION_PROJECTS[orgSlug].find((p) => p.ref === ref)
          if (match) {
            return match
          }
        }
        return null
      },
    })),
    combine: (queries) => {
      return {
        data: queries.flatMap((query) => (query.data != null ? [query.data] : [])),
        isPending: queries.some((query) => query.isPending),
        isError: queries.some((query) => query.isError),
        error: queries.find((query) => query.isError)?.error,
      }
    },
  })
}
