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

export type SupabaseConfigVercel = {
  environmentVariables: {
    production: boolean
    preview: boolean
  }
  authRedirectUris: {
    production: boolean
    preview: boolean
  }
}

export type Imetadata = {
  id: string
  supabaseConfig?: {
    environmentVariables?: {
      production: boolean
      preview: boolean
    }
    authRedirectUris?: {
      production: boolean
      preview: boolean
    }
    supabaseDirectory?: string
  }
  link?: VercelGitLink
  name: string
  framework: VercelFramework
}

export type IntegrationProjectConnection = {
  id: string
  inserted_at: string
  updated_at: string
  added_by: addedBy
  supabase_project_ref: string
  foreign_project_id: string
  organization_integration_id: string
  metadata: Imetadata
}

export type IntegrationsVariables = {
  orgSlug?: string
}

export type IntegrationProjectConnectionPayload = {
  foreignProjectId: string
  supabaseProjectId: string
  integrationId: string
  metadata: Imetadata
}

export type userDetails = {
  username: string
  id: string
  primary_email: string
}
type addedBy = userDetails
type updatedBy = userDetails

export type IntegrationName = 'Vercel' | 'GitHub' // | 'Netlify'
export type VercelAccountType = 'Team' | 'Personal'
export type VercelSource = 'marketplace' | 'deploy button'

type BaseVercelAccount = {
  name: string
  avatar: string
  source: VercelSource
  owner_id: string
}

export type VercelAccount = BaseVercelAccount & {
  type: 'Personal'
}

export type VercelTeamAccount = BaseVercelAccount & {
  type: 'Team'
  team_id: string
  team_slug: string
}

export type VercelMetadata = {
  vercelTeam?: string
  gitHubConnectionOwner?: string
  account: VercelAccount | VercelTeamAccount
  configuration_id: string
}

export type GitHubAccount = {
  name: string
  type: 'User' | 'Organization'
  avatar: string
  installed_by_user_id: number
}

export type GitHubMetadata = {
  installation_id: number
  account: GitHubAccount
}

export type IntegrationBase = {
  id: string
  added_by: addedBy
  inserted_at: string
  updated_at: string
  connections: IntegrationProjectConnection[] | []
  organization: {
    slug: string
  }
}

export type Integration =
  | (IntegrationBase & {
      id: string
      integration: {
        name: 'Vercel'
      }
      metadata?: VercelMetadata
    })
  | (IntegrationBase & {
      id: string
      integration: {
        name: 'GitHub'
      }
      metadata?: GitHubMetadata
    })

export type IntegrationConnectionsCreateVariables = {
  organizationIntegrationId: string
  connection: {
    foreign_project_id: string
    supabase_project_ref: string
    metadata: any
  }
  orgSlug: string | undefined
}

export type UpdateConnectionPayload = {
  id: string
  organizationIntegrationId: string
  metadata: Imetadata
}
