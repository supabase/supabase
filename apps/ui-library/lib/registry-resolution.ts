import type { RegistryItem } from 'shadcn/schema'

export type RegistryFile = NonNullable<RegistryItem['files']>[number]

/** Canonical folders before the installing project's aliases or src directory are applied. */
export function getInstalledPath(file: { path: string; target?: string }): string {
  const source = (file.target || file.path).replace(/\\/g, '/').replace(/^\.\//, '')
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
  for (const destination of destinations.keys()) {
    const parts = destination.split('/')
    for (let index = 1; index < parts.length; index++) {
      const parent = parts.slice(0, index).join('/')
      if (destinations.has(parent)) {
        throw new Error(
          `${context}: file "${parent}" conflicts with directory for "${destination}"`
        )
      }
    }
  }
  return [...destinations.values()]
}

export type ResolvedRegistryItem = RegistryItem & {
  files: RegistryFile[]
  firstPartyDependencies: string[]
  externalRegistryDependencies: string[]
}

/** Resolve this registry's dependencies without fetching or pretending to inventory external UI kits. */
export function resolveRegistryItem(
  registry: { items: readonly RegistryItem[] },
  name: string
): ResolvedRegistryItem {
  const items = new Map<string, RegistryItem>()
  for (const item of registry.items) {
    if (items.has(item.name)) throw new Error(`Duplicate registry item "${item.name}"`)
    items.set(item.name, item)
  }
  const root = items.get(name)
  if (!root) throw new Error(`Missing registry item "${name}"`)

  const visited = new Set<string>()
  const files: RegistryFile[] = []
  const external = new Set<string>()
  const visit = (itemName: string, ancestors: string[]) => {
    if (ancestors.includes(itemName)) {
      throw new Error(`Registry dependency cycle: ${[...ancestors, itemName].join(' -> ')}`)
    }
    if (visited.has(itemName)) return
    const item = items.get(itemName)
    if (!item) {
      throw new Error(
        `Registry item "${ancestors.at(-1)}" references missing dependency "${itemName}"`
      )
    }
    visited.add(itemName)
    files.push(...(item.files ?? []))
    for (const dependency of item.registryDependencies ?? []) {
      const localName = getFirstPartyDependencyName(dependency)
      if (localName) visit(localName, [...ancestors, itemName])
      else external.add(dependency)
    }
  }
  visit(name, [])

  return {
    ...root,
    files: uniqueInstalledFiles(files, `Registry item "${name}"`),
    firstPartyDependencies: [...visited].filter((itemName) => itemName !== name),
    externalRegistryDependencies: [...external],
  }
}
