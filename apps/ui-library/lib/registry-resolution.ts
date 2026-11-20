import type { RegistryItem } from 'shadcn/schema'

export type RegistryFile = NonNullable<RegistryItem['files']>[number]

/** Canonical folders before the installing project's aliases or src directory are applied. */
export function getInstalledPath(file: { path: string; target?: string }): string {
  // A `~/` target opts a file out of the project's src directory, so it is already project-relative.
  const source = (file.target || file.path)
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/^~\//, '')
  const installedPath = file.target
    ? source
    : source
        .replace(/^node_modules\/@supabase\/vue-blocks\//, '')
        .replace(/^registry\/[^/]+\/(?:blocks|clients|platform)\/[^/]+\//, '')

  if (
    !installedPath ||
    /^(?:\/|[a-z]:)/i.test(installedPath) ||
    installedPath.split('/').some((part) => !part || part === '.' || part === '..')
  ) {
    throw new Error(`Invalid installed path "${installedPath}" for registry file "${file.path}"`)
  }
  return installedPath
}

/** Keep Vue's alias-based installer from treating package source folders as installed folders. */
export function normalizeVueRegistryFiles(files: RegistryFile[]): RegistryFile[] {
  return files.map((file) =>
    !file.target && file.path.startsWith('node_modules/@supabase/vue-blocks/')
      ? { ...file, path: getInstalledPath(file) }
      : file
  )
}

/** Bare names belong to the CLI's UI registry; only explicit Supabase references are local. */
export function getFirstPartyDependencyName(dependency: string): string | undefined {
  const prefix = dependency.startsWith('@supabase/')
    ? '@supabase/'
    : dependency.startsWith('https://supabase.com/library/r/')
      ? 'https://supabase.com/library/r/'
      : undefined
  if (!prefix) return undefined

  const name = dependency.slice(prefix.length).replace(/\.json$/, '')
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    throw new Error(`Invalid Supabase registry dependency "${dependency}"`)
  }
  return name
}

export function uniqueInstalledFiles<
  T extends { path: string; target?: string; content?: string; type?: string },
>(files: readonly T[], context: string): T[] {
  const destinations = new Map<string, T>()
  for (const file of files) {
    const destination = getInstalledPath(file)
    const previous = destinations.get(destination)
    if (
      previous &&
      (previous.path !== file.path ||
        previous.type !== file.type ||
        previous.content !== file.content)
    ) {
      throw new Error(
        `${context}: conflicting destination "${destination}" from "${previous.path}" and "${file.path}"`
      )
    }
    if (!previous) destinations.set(destination, file)
  }
  return [...destinations.values()]
}

export type ResolvedRegistryItem = RegistryItem & {
  files: RegistryFile[]
  firstPartyDependencies: string[]
  externalRegistryDependencies: string[]
}

/** Follow Supabase dependencies only; external UI kits are the installer's responsibility. */
export function resolveRegistryItem(
  getItem: (name: string) => RegistryItem | undefined,
  name: string
): ResolvedRegistryItem {
  const root = getItem(name)
  if (!root) throw new Error(`Missing registry item "${name}"`)

  const visited = new Set<string>()
  const external = new Set<string>()
  const files: RegistryFile[] = []
  const visit = (item: RegistryItem, ancestors: string[]) => {
    if (visited.has(item.name)) return
    visited.add(item.name)
    files.push(...(item.files ?? []))
    const path = [...ancestors, item.name]
    for (const dependency of item.registryDependencies ?? []) {
      const localName = getFirstPartyDependencyName(dependency)
      if (!localName) {
        external.add(dependency)
        continue
      }
      if (path.includes(localName)) {
        throw new Error(`Registry dependency cycle: ${[...path, localName].join(' -> ')}`)
      }
      let dependencyItem: RegistryItem | undefined
      try {
        dependencyItem = getItem(localName)
      } catch (error) {
        throw new Error(
          `Registry item "${item.name}" references missing dependency "${localName}"`,
          { cause: error }
        )
      }
      if (!dependencyItem) {
        throw new Error(`Registry item "${item.name}" references missing dependency "${localName}"`)
      }
      visit(dependencyItem, path)
    }
  }
  visit(root, [])

  return {
    ...root,
    files: uniqueInstalledFiles(files, `Registry item "${name}"`),
    firstPartyDependencies: [...visited].filter((itemName) => itemName !== name),
    externalRegistryDependencies: [...external],
  }
}
