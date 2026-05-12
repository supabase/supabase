'use client'

import { useQuery } from '@tanstack/react-query'

import { client } from '@/registry/default/platform/platform-kit-nextjs/lib/management-api'

// GET Suggestions
const getSuggestions = async (projectRef: string) => {
  const [
    { data: performanceData, error: performanceError },
    { data: securityData, error: securityError },
  ] = await Promise.all([
    client.GET('/v1/projects/{ref}/advisors/performance', {
      params: {
        path: {
          ref: projectRef,
        },
      },
    }),
    client.GET('/v1/projects/{ref}/advisors/security', {
      params: {
        path: {
          ref: projectRef,
        },
      },
    }),
  ])
  if (performanceError) {
    throw performanceError
  }
  if (securityError) {
    throw securityError
  }

  // Add type to each suggestion
  const performanceLints = (performanceData?.lints || []).map((lint) => ({
    ...lint,
    type: 'performance' as const,
  }))
  const securityLints = (securityData?.lints || []).map((lint) => ({
    ...lint,
    type: 'security' as const,
  }))
  return [...performanceLints, ...securityLints]
}

export const useGetSuggestions = (projectRef: string) => {
  return useQuery({
    queryKey: ['suggestions', projectRef],
    queryFn: () => getSuggestions(projectRef),
    enabled: !!projectRef,
    retry: false,
  })
}
