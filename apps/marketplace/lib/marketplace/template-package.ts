export function normalizeTemplatePath(path: string, rootPrefix: string | null) {
  const stripped = path.replace(/^\/+/, '')
  if (!rootPrefix) return stripped
  if (stripped === rootPrefix) return ''
  const prefix = `${rootPrefix}/`
  return stripped.startsWith(prefix) ? stripped.slice(prefix.length) : stripped
}

export function shouldIgnoreTemplatePath(path: string) {
  const normalized = path.replace(/^\/+/, '')
  const segments = normalized.split('/').filter(Boolean)
  if (segments.length === 0) return true

  // Ignore macOS/system artifacts commonly present in ZIP archives.
  if (segments[0] === '__MACOSX') return true
  const fileName = segments[segments.length - 1] ?? ''
  if (fileName.toLowerCase() === '.ds_store') return true
  if (fileName.startsWith('._')) return true

  return false
}

export function inferTemplateRootPrefix(paths: string[]) {
  const topLevelDirs = new Set(paths.map((path) => path.split('/')[0]).filter(Boolean))
  return topLevelDirs.size === 1 ? Array.from(topLevelDirs)[0] ?? null : null
}

export function normalizeTemplatePaths(paths: string[]) {
  const filtered = paths.filter((path) => !shouldIgnoreTemplatePath(path))
  const rootPrefix = inferTemplateRootPrefix(filtered)
  return filtered
    .map((path) => normalizeTemplatePath(path, rootPrefix))
    .filter((path) => path.length > 0)
}

export function hasRequiredTemplateEntries(paths: string[]) {
  const normalized = normalizeTemplatePaths(paths)
  const hasRegistry = normalized.some((path) => path === 'template.json')
  const hasFunctions = normalized.some((path) => path.startsWith('functions/'))
  const hasSchemas = normalized.some((path) => path.startsWith('schemas/'))
  const hasMigrations = normalized.some((path) => path.startsWith('migrations/'))
  const hasConfig = normalized.some((path) => path === 'config.toml')
  return hasRegistry && hasFunctions && (hasSchemas || hasMigrations || hasConfig)
}
