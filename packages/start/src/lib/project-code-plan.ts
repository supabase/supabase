import { getRegistryAddCommand, getRegistrySearchCommand, getRegistryViewCommand } from 'templates'

import type { StartComposition } from './composition/start-composition'
import { listEnglish, ORMS, type StartConfig } from './config'

export type ProjectCodeFileGroupId = 'config' | 'schema' | 'seed' | 'edge-functions' | 'other'

export interface ProjectCodeTemplateCommand {
  id: string
  name: string
  command: string
}

export interface ProjectCodeTemplate {
  id: string
  name: string
}

export interface ProjectCodeFileGroup {
  id: ProjectCodeFileGroupId
  label: string
  files: string[]
}

export interface ProjectCodePlan {
  hasProjectCode: boolean
  listCommand: string
  searchExampleCommand: string
  selectedTemplates: ProjectCodeTemplate[]
  dependencyTemplates: ProjectCodeTemplate[]
  addCommands: ProjectCodeTemplateCommand[]
  viewCommands: ProjectCodeTemplateCommand[]
  fileGroups: ProjectCodeFileGroup[]
  filePaths: string[]
  schemaFiles: string[]
  configFiles: string[]
  seedFiles: string[]
  edgeFunctionFiles: string[]
  edgeFunctionNames: string[]
  ormConversionNote: string | null
  migrationCommands: string[]
  deployCommands: string[]
}

const FILE_GROUP_LABELS: Record<ProjectCodeFileGroupId, string> = {
  config: 'Project config',
  schema: 'Database schemas',
  seed: 'Seed data',
  'edge-functions': 'Edge Functions',
  other: 'Other project files',
}

export function buildProjectCodePlan(
  cfg: StartConfig,
  composition: StartComposition
): ProjectCodePlan {
  const resolvedById = new Map(
    composition.resolution.resolved.map((template) => [template.id, template])
  )
  const explicitIds = new Set(composition.explicitTemplateIds)
  const selectedTemplates = composition.explicitTemplateIds.flatMap((id) => {
    const template = resolvedById.get(id)
    return template ? [{ id: template.id, name: template.name }] : []
  })
  const dependencyTemplates = composition.resolution.resolved
    .filter((template) => !explicitIds.has(template.id))
    .map((template) => ({ id: template.id, name: template.name }))

  const filePaths = (composition.mergeResult?.files ?? [])
    .map((file) => file.path)
    .sort((a, b) => a.localeCompare(b))
  const fileGroups = groupProjectCodeFiles(filePaths)
  const schemaFiles = filePaths.filter(isSchemaFile)
  const configFiles = filePaths.filter((path) => path === 'supabase/config.toml')
  const seedFiles = filePaths.filter((path) => path === 'supabase/seed.sql')
  const edgeFunctionFiles = filePaths.filter(isEdgeFunctionFile)
  const edgeFunctionNames = composition.resources
    .filter((resource) => resource.kind === 'edge-function')
    .map((resource) => resource.label)
    .sort((a, b) => a.localeCompare(b))

  return {
    hasProjectCode: selectedTemplates.length > 0 || filePaths.length > 0,
    listCommand: getRegistrySearchCommand(),
    searchExampleCommand: 'npx shadcn@latest search supabase/supabase -q <query>',
    selectedTemplates,
    dependencyTemplates,
    addCommands: selectedTemplates.map((template) => ({
      ...template,
      command: getRegistryAddCommand(template.id),
    })),
    viewCommands: selectedTemplates.map((template) => ({
      ...template,
      command: getRegistryViewCommand(template.id),
    })),
    fileGroups,
    filePaths,
    schemaFiles,
    configFiles,
    seedFiles,
    edgeFunctionFiles,
    edgeFunctionNames,
    ormConversionNote: schemaFiles.length > 0 ? getOrmConversionNote(cfg, schemaFiles) : null,
    migrationCommands: getMigrationCommands(cfg, schemaFiles),
    deployCommands: edgeFunctionNames.map((name) => `npx supabase functions deploy ${name}`),
  }
}

export function formatProjectCodeFileGroups(fileGroups: ProjectCodeFileGroup[]): string {
  if (fileGroups.length === 0) return 'No project files are added for this selection.'

  return fileGroups
    .flatMap((group) => [`# ${group.label}`, ...group.files, ''])
    .join('\n')
    .trim()
}

function groupProjectCodeFiles(filePaths: string[]): ProjectCodeFileGroup[] {
  const groups = new Map<ProjectCodeFileGroupId, string[]>()

  for (const path of filePaths) {
    const groupId = getProjectCodeFileGroupId(path)
    groups.set(groupId, [...(groups.get(groupId) ?? []), path])
  }

  return (Object.keys(FILE_GROUP_LABELS) as ProjectCodeFileGroupId[])
    .map((id) => ({
      id,
      label: FILE_GROUP_LABELS[id],
      files: groups.get(id) ?? [],
    }))
    .filter((group) => group.files.length > 0)
}

function getProjectCodeFileGroupId(path: string): ProjectCodeFileGroupId {
  if (path === 'supabase/config.toml') return 'config'
  if (path === 'supabase/seed.sql') return 'seed'
  if (isSchemaFile(path)) return 'schema'
  if (isEdgeFunctionFile(path)) return 'edge-functions'
  return 'other'
}

function getOrmConversionNote(cfg: StartConfig, schemaFiles: string[]): string | null {
  if (cfg.orm === 'none') return null

  const orm = ORMS[cfg.orm]

  return `Use the installed SQL files as source material for ${orm.label}: convert ORM-owned tables, enums and relations from ${listEnglish(
    schemaFiles
  )} into ${orm.schemaFile}. Keep RLS policies, SQL functions, triggers, extensions, Storage setup and seed data as SQL migrations, and avoid creating the same table in both the ORM schema and SQL files.`
}

function getMigrationCommands(cfg: StartConfig, schemaFiles: string[]): string[] {
  if (schemaFiles.length === 0) return []

  if (cfg.orm === 'drizzle') {
    return [
      'npx drizzle-kit generate   # after porting ORM-owned schema to src/db/schema.ts',
      'npx drizzle-kit migrate    # apply generated ORM migrations',
      'npx supabase db diff -f preserve_template_sql   # after keeping only non-ORM SQL in supabase/schemas/*.sql',
      'npx supabase migration up',
    ]
  }

  if (cfg.orm === 'prisma') {
    return [
      'npx prisma migrate dev --name update_schema   # after porting ORM-owned schema to prisma/schema.prisma',
      'npx supabase db diff -f preserve_template_sql   # after keeping only non-ORM SQL in supabase/schemas/*.sql',
      'npx supabase migration up',
    ]
  }

  return [
    'npx supabase db diff -f update_schema   # generate the migration',
    'npx supabase migration up               # apply locally',
  ]
}

function isSchemaFile(path: string): boolean {
  return /^supabase\/schemas\/[^/]+\.sql$/.test(path)
}

function isEdgeFunctionFile(path: string): boolean {
  return /^supabase\/functions\//.test(path)
}
