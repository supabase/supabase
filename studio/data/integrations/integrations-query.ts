import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { integrationKeys } from './keys'

type metadata = {
  metadata: {
    id: string
    supabaseConfig: {
      // branching: {
      //   prodBranch: string
      // }
      projectEnvVars: {
        write: boolean
      }
      // supabaseDeploymentConfig: {
      //   functions: {
      //     deploy: false
      //   }
      // }
    }
    link?:
      | {
          org?: string
          repo?: string
          repoId?: number
          type?: 'github'
          createdAt?: number
          deployHooks: {
            createdAt?: number
            id: string
            name: string
            ref: string
            url: string
          }[]
          gitCredentialId?: string
          updatedAt?: number
          sourceless?: boolean
          productionBranch?: string
        }
      | {
          projectId?: string
          projectName?: string
          projectNameWithNamespace?: string
          projectNamespace?: string
          projectUrl?: string
          type?: 'gitlab'
          createdAt?: number
          deployHooks: {
            createdAt?: number
            id: string
            name: string
            ref: string
            url: string
          }[]
          gitCredentialId?: string
          updatedAt?: number
          sourceless?: boolean
          productionBranch?: string
        }
      | {
          name?: string
          slug?: string
          owner?: string
          type?: 'bitbucket'
          uuid?: string
          workspaceUuid?: string
          createdAt?: number
          deployHooks: {
            createdAt?: number
            id: string
            name: string
            ref: string
            url: string
          }[]
          gitCredentialId?: string
          updatedAt?: number
          sourceless?: boolean
          productionBranch?: string
        }
    name: string
    framework:
      | (
          | 'blitzjs'
          | 'nextjs'
          | 'gatsby'
          | 'remix'
          | 'astro'
          | 'hexo'
          | 'eleventy'
          | 'docusaurus-2'
          | 'docusaurus'
          | 'preact'
          | 'solidstart'
          | 'dojo'
          | 'ember'
          | 'vue'
          | 'scully'
          | 'ionic-angular'
          | 'angular'
          | 'polymer'
          | 'svelte'
          | 'sveltekit'
          | 'sveltekit-1'
          | 'ionic-react'
          | 'create-react-app'
          | 'gridsome'
          | 'umijs'
          | 'sapper'
          | 'saber'
          | 'stencil'
          | 'nuxtjs'
          | 'redwoodjs'
          | 'hugo'
          | 'jekyll'
          | 'brunch'
          | 'middleman'
          | 'zola'
          | 'hydrogen'
          | 'vite'
          | 'vitepress'
          | 'vuepress'
          | 'parcel'
          | 'sanity'
          | 'storybook'
        )
      | null
  }
}
export type IntegrationProjectConnection = {
  id: string
  created_at: string
  updated_at: string
  added_by: addedBy
  project_ref: string
  organization_integration_id: string
  metadata: metadata
}

export type IntegrationsVariables = {
  orgSlug?: string
}

export type IntegrationProjectConnectionPayload = {
  foreignProjectId: string
  supabaseProjectId: string
  integrationId: string
  metadata: metadata
}

type userDetails = {
  username: string
  id: string
  primary_email: string
}
type addedBy = userDetails
type updatedBy = userDetails

export type Integration = {
  id: string
  integration: {
    id: string
    name: 'Vercel' | 'Netlify' | 'GitHub'
  }
  added_by: addedBy
  created_at: string
  updated_at: string
  connections: IntegrationProjectConnection[]
  metadata?: {
    vercelTeam?: string
    gitHubConnectionOwner?: string
  }
}

export type IntegrationsResponse = Integration[]

export async function getIntegrations({ orgSlug }: IntegrationsVariables, signal?: AbortSignal) {
  if (!orgSlug) {
    throw new Error('orgSlug is required')
  }

  // const response: IntegrationsResponse = [
  //   {
  //     id: '1',
  //     type: 'VERCEL',
  //     createdBy: 'alaister@supabase.io',
  //     createdAt: '2023-06-05T06:56:25.565Z',
  //     metadata: {
  //       vercelTeam: 'alaister-team',
  //     },
  //     connections: [
  //       {
  //         id: '1.0',
  //         createdAt: '2023-06-05T01:56:25.565Z',
  //         to: {
  //           name: 'www prod',
  //         },
  //         from: {
  //           name: 'alaister project prod',
  //         },
  //       },
  //       {
  //         id: '1.1',
  //         createdAt: '2023-06-14T06:56:25.565Z',
  //         to: {
  //           name: 'www staging',
  //         },
  //         from: {
  //           name: 'alaister project staging',
  //         },
  //       },
  //       {
  //         id: '1.1',
  //         createdAt: '2023-06-02T21:56:25.565Z',
  //         to: {
  //           name: 'bees knees',
  //         },
  //         from: {
  //           name: 'jonny bee project',
  //         },
  //       },
  //     ],
  //   },
  //   {
  //     id: '2',
  //     type: 'VERCEL',
  //     createdBy: 'alaister@supabase.io',
  //     createdAt: '2023-06-05T06:56:25.565Z',
  //     metadata: {
  //       vercelTeam: 'alaister-team',
  //     },
  //     connections: [],
  //   },
  //   {
  //     id: '3',
  //     type: 'GITHUB',
  //     createdBy: 'Alaister',
  //     createdAt: '2023-06-05T06:56:25.565Z',
  //     metadata: {
  //       gitHubConnectionOwner: 'alaister',
  //     },
  //     connections: [
  //       {
  //         id: '1.2',
  //         createdAt: '2023-06-05T06:56:25.565Z',
  //         to: {
  //           name: 'supabase/supabase',
  //         },
  //         from: {
  //           name: 'alaister project',
  //         },
  //       },
  //     ],
  //   },
  // ]

  const response = await get(`${API_URL}/integrations/${orgSlug}`, {
    signal,
  })
  if (response.error) {
    throw response.error
  }

  return response as IntegrationsResponse
}

// export async function getProjectIntegrationConnections(
//   { orgSlug }: IntegrationsVariables,
//   signal?: AbortSignal
// ) {
//   if (!orgSlug) {
//     throw new Error('orgSlug is required')
//   }

//   const response = await get(`${API_URL}/integrations`, {
//     signal,
//   })
//   if (response.error) {
//     throw response.error
//   }

//   return response as IntegrationsResponse
// }

export type IntegrationsData = Awaited<ReturnType<typeof getIntegrations>>
export type ProjectIntegrationConnectionsData = Awaited<
  ReturnType<typeof getProjectIntegrationConnections>
>
export type IntegrationsError = unknown

export const useIntegrationsQuery = <TData = IntegrationsData>(
  { orgSlug }: IntegrationsVariables,
  { enabled = true, ...options }: UseQueryOptions<IntegrationsData, IntegrationsError, TData> = {}
) =>
  useQuery<IntegrationsData, IntegrationsError, TData>(
    integrationKeys.list(orgSlug),
    ({ signal }) => getIntegrations({ orgSlug }, signal),
    { enabled: enabled && typeof orgSlug !== 'undefined', ...options }
  )
