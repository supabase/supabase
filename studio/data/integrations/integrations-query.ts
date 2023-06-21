import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { integrationKeys } from './keys'

export type VercelFramework =
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

export type VercelGitLink =
  | {
      /**
       * GitHub link
       */
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
      /**
       * GitLab link
       */
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
      /**
       * Bitbucket link
       */
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

type Imetadata = {
  metadata: {
    id: string
    supabaseConfig: {
      projectEnvVars: {
        write: boolean
      }
    }
    link?: VercelGitLink
    name: string
    framework: VercelFramework
  }
}
export type IntegrationProjectConnection = {
  id: string
  created_at: string
  updated_at: string
  added_by: addedBy
  supabase_project_id: string
  foreign_project_id: string
  organization_integration_id: string
  metadata: Imetadata
}

export type IntegrationsVariables = {
  orgId?: number
}

export type IntegrationProjectConnectionPayload = {
  foreignProjectId: string
  supabaseProjectId: string
  integrationId: string
  metadata: Imetadata
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
  connections: IntegrationProjectConnection[] | []
  metadata?: {
    vercelTeam?: string
    gitHubConnectionOwner?: string
  }
}

export type IntegrationsResponse = Integration[]

export async function getIntegrations({ orgId }: IntegrationsVariables, signal?: AbortSignal) {
  if (!orgId) {
    throw new Error('orgId is required')
  }

  const response = await get(`${API_URL}/integrations/${orgId}`, {
    signal,
  })
  if (response.error) {
    throw response.error
  }

  return response as IntegrationsResponse
}

export type IntegrationsData = Awaited<ReturnType<typeof getIntegrations>>
export type ProjectIntegrationConnectionsData = Awaited<
  ReturnType<typeof getProjectIntegrationConnections>
>
export type IntegrationsError = unknown

export const useIntegrationsQuery = <TData = IntegrationsData>(
  { orgId }: IntegrationsVariables,
  { enabled = true, ...options }: UseQueryOptions<IntegrationsData, IntegrationsError, TData> = {}
) =>
  useQuery<IntegrationsData, IntegrationsError, TData>(
    integrationKeys.list(orgId),
    ({ signal }) => getIntegrations({ orgId }, signal),
    { enabled: enabled && typeof orgId !== 'undefined', ...options }
  )
