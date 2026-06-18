import type { TemplateFile } from '../schema'

export const SUPABASE_CONFIG_TOML = 'supabase/config.toml'

export function extractTomlBlocksFromReadme(readme?: string): string[] {
  if (!readme) return []

  return [...readme.matchAll(/```toml\n([\s\S]*?)```/g)]
    .map((match) => match[1].trim())
    .filter(Boolean)
}

export function configTomlFromReadme(readme?: string): string | undefined {
  const blocks = extractTomlBlocksFromReadme(readme)
  if (blocks.length === 0) return undefined

  return blocks.join('\n\n')
}

export function appendConfigTomlFromReadme(
  files: TemplateFile[],
  readme?: string
): TemplateFile[] {
  if (files.some((file) => file.path === SUPABASE_CONFIG_TOML)) {
    return files
  }

  const configToml = configTomlFromReadme(readme)
  if (!configToml) {
    return files
  }

  return [...files, { path: SUPABASE_CONFIG_TOML, content: configToml }]
}

export function assertRegistryItemHasContent(
  itemName: string,
  files: TemplateFile[],
  readme?: string
): void {
  if (files.length > 0) return
  if (readme?.trim()) return

  throw new Error(`Registry item "${itemName}" must declare at least one file or docs`)
}
