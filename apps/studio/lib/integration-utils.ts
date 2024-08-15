import type { Integration } from 'data/integrations/integrations.types'
import type { SupaResponse } from 'types'
import { isResponseOk } from './common/fetch'

async function fetchGitHub<T = any>(url: string, responseJson = true): Promise<SupaResponse<T>> {
  const response = await fetch(url)
  if (!response.ok) {
    return {
      error: {
        code: response.status,
        message: response.statusText,
        requestId: '',
      },
    }
  }
  try {
    return (responseJson ? await response.json() : await response.text()) as T
  } catch (error: any) {
    return {
      error: {
        message: error.message,
        code: 500,
        requestId: '',
      },
    }
  }
}

export type File = {
  name: string
  download_url: string
}

/**
 * Returns the initial migration SQL from a GitHub repo.
 * @param externalId An external GitHub URL for example: https://github.com/vercel/next.js/tree/canary/examples/with-supabase
 */
export async function getInitialMigrationSQLFromGitHubRepo(
  externalId?: string
): Promise<string | null> {
  if (!externalId) return null

  const [, , , owner, repo, , branch, ...pathSegments] = externalId?.split('/') ?? []
  const path = pathSegments.join('/')

  const baseGitHubUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
  const supabaseFolderUrl = `${baseGitHubUrl}/supabase?ref=${branch}`
  const supabaseMigrationsPath = `supabase/migrations` // TODO: read this from the `supabase/config.toml` file
  const migrationsFolderUrl = `${baseGitHubUrl}/${supabaseMigrationsPath}${
    branch ? `?ref=${branch}` : ``
  }`

  const [supabaseFilesResponse, migrationFilesResponse] = await Promise.all([
    fetchGitHub<File[]>(supabaseFolderUrl),
    fetchGitHub<File[]>(migrationsFolderUrl),
  ])

  if (!isResponseOk(supabaseFilesResponse)) {
    console.warn(`Failed to fetch supabase files from GitHub: ${supabaseFilesResponse.error}`)
    return null
  }
  if (!isResponseOk(migrationFilesResponse)) {
    console.warn(`Failed to fetch migration files from GitHub: ${migrationFilesResponse.error}`)
    return null
  }

  const seedFileUrl = supabaseFilesResponse.find((file) => file.name === 'seed.sql')?.download_url
  const sortedFiles = migrationFilesResponse.sort((a, b) => {
    // sort by name ascending
    if (a.name < b.name) return -1
    if (a.name > b.name) return 1
    return 0
  })
  const migrationFileDownloadUrlPromises = sortedFiles.map((file) =>
    fetchGitHub<string>(file.download_url, false)
  )

  const [seedFileResponse, ...migrationFileResponses] = await Promise.all([
    seedFileUrl ? fetchGitHub<string>(seedFileUrl, false) : Promise.resolve<string>(''),
    ...migrationFileDownloadUrlPromises,
  ])

  const migrations = migrationFileResponses.filter((response) => isResponseOk(response)).join(';')
  const seed = isResponseOk(seedFileResponse) ? seedFileResponse : ''

  const migrationsTableSql = /* SQL */ `
    create schema if not exists supabase_migrations;
    create table if not exists supabase_migrations.schema_migrations (
      version text not null primary key,
      statements text[],
      name text
    );
    ${sortedFiles.map((file, i) => {
      const migration = migrationFileResponses[i]
      if (!isResponseOk(migration)) return ''

      const version = file.name.split('_')[0]
      const statements = JSON.stringify(
        migration
          .split(';')
          .map((statement) => statement.trim())
          .filter(Boolean)
      )

      return /* SQL */ `
        insert into supabase_migrations.schema_migrations (version, statements, name)
        select '${version}', array_agg(jsonb_statements)::text[], '${file.name}'
        from jsonb_array_elements_text($statements$${statements}$statements$::jsonb) as jsonb_statements;
      `
    })}
  `

  return `${migrations};${migrationsTableSql};${seed}`
}

type VercelIntegration = Extract<Integration, { integration: { name: 'Vercel' } }>
type GitHubIntegration = Extract<Integration, { integration: { name: 'GitHub' } }>

export function getIntegrationConfigurationUrl(integration: Integration) {
  if (integration.integration.name === 'Vercel') {
    return getVercelConfigurationUrl(integration as VercelIntegration)
  }

  if (integration.integration.name === 'GitHub') {
    return getGitHubConfigurationUrl(integration as GitHubIntegration)
  }

  return ''
}

function getVercelConfigurationUrl(integration: VercelIntegration) {
  return `https://vercel.com/dashboard/${
    integration.metadata?.account.type === 'Team'
      ? `${integration.metadata?.account.team_slug}/`
      : ''
  }integrations/${integration.metadata?.configuration_id}`
}

function getGitHubConfigurationUrl(integration: GitHubIntegration) {
  return `https://github.com/${
    integration.metadata?.account.type === 'Organization'
      ? `organizations/${integration.metadata?.account.name}/`
      : ''
  }settings/installations/${integration.metadata?.installation_id}`
}
