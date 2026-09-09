export type ArchitectureResourceKind =
  | 'capability'
  | 'page'
  | 'route'
  | 'layout'
  | 'middleware'
  | 'component'
  | 'hook'
  | 'client'
  | 'utility'
  | 'edge-function'
  | 'migration'
  | 'table'
  | 'bucket'
  | 'service'
  | 'config'
  | 'file'

export type ArchitectureResource = {
  id: string
  label: string
  description: string
  kind: ArchitectureResourceKind
  status: 'added' | 'existing'
  files: string[]
  route?: string
}

export type ArchitectureRelationship = {
  id: string
  source: string
  target: string
  label: string
}

export type BlockArchitecture = {
  name: string
  title: string
  description?: string
  resources: ArchitectureResource[]
  relationships: ArchitectureRelationship[]
  fileCount: number
}

export type BlockArchitectureDefinition = {
  name: string
  title?: string
  description?: string
  files?: readonly { path: string; target?: string; type?: string }[]
  meta?: {
    architecture?: {
      resources?: readonly (Pick<ArchitectureResource, 'id' | 'label' | 'kind'> &
        Partial<Omit<ArchitectureResource, 'id' | 'label' | 'kind'>>)[]
      relationships?: readonly { source: string; target: string; label?: string }[]
    }
  }
}

const extension = /\.(?:[cm]?[jt]sx?|vue|svelte)$/

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '')
}

function installationPath(file: NonNullable<BlockArchitectureDefinition['files']>[number]): string {
  const path = normalizePath(file.target || file.path)
  // Registry source directories are packaging details, not installed folders.
  return path.replace(/^registry\/[^/]+\/(?:blocks|clients|platform)\/[^/]+\//, '')
}

function routePath(path: string, flat: boolean, removeIndex = true): string {
  const segments = path
    .replace(extension, '')
    .split(flat ? /[/.]/ : '/')
    .filter((segment) => segment && !segment.startsWith('_') && !/^\(.*\)$/.test(segment))
    .filter(
      (segment, index, segments) =>
        !removeIndex || segment !== 'index' || index !== segments.length - 1
    )
    .map((segment) => segment.replace(/\$$/, '*').replace(/^\$(.+)/, ':$1'))
  return `/${segments.join('/')}`
}

function classify(path: string, type?: string): Pick<ArchitectureResource, 'kind' | 'route'> {
  if (/^(?:src\/)?(middleware|proxy)\.[cm]?[jt]s$/.test(path)) return { kind: 'middleware' }
  if (/(^|\/)supabase\/migrations\/.+\.sql$/.test(path)) return { kind: 'migration' }

  const appRoute = path.match(/^(?:src\/)?app\/((?:.*\/)?)(page|route|layout)\.[jt]sx?$/)
  if (appRoute) {
    return {
      kind: appRoute[2] === 'page' ? 'page' : appRoute[2] === 'layout' ? 'layout' : 'route',
      route: routePath(appRoute[1], false, false),
    }
  }
  const fileRoute = path.match(/^(?:src\/|app\/)?(routes|pages)\/(.+)$/)
  if (fileRoute && extension.test(fileRoute[2])) {
    const file = fileRoute[2].replace(extension, '')
    const isLayout = /(^|\/)(_\w+|__root|_layout)$/.test(file)
    return {
      kind: isLayout
        ? 'layout'
        : fileRoute[1] === 'pages' && !file.startsWith('api/')
          ? 'page'
          : 'route',
      route: routePath(fileRoute[2], fileRoute[1] === 'routes'),
    }
  }
  if (/^(?:src\/)?server\/(api|routes)\//.test(path)) {
    const handlerPath = path
      .replace(/^(?:src\/)?server\/(?:routes\/)?/, '')
      .replace(/\.(get|post|put|patch|delete|head|options)(\.[cm]?[jt]s)$/, '$2')
    return { kind: 'route', route: routePath(handlerPath, false) }
  }
  if (type === 'registry:page') return { kind: 'page' }
  if (type === 'registry:hook' || /(^|\/)(hooks|composables)\//.test(path)) return { kind: 'hook' }
  if (/^(?:src\/)?(?:lib|utils)\/supabase\/(client|server|middleware)\.[jt]s$/.test(path)) {
    return { kind: 'client' }
  }
  if (type === 'registry:component' || type === 'registry:ui' || /(^|\/)components\//.test(path)) {
    return { kind: 'component' }
  }
  if (type === 'registry:lib' || /(^|\/)(lib|utils)\//.test(path)) return { kind: 'utility' }
  if (/\.(json|ya?ml|toml)$/.test(path) || /(^|\/)\.env/.test(path) || /\.config\./.test(path)) {
    return { kind: 'config' }
  }
  return { kind: 'file' }
}

/** Describe declared installation resources without inferring runtime behavior from filenames. */
export function generateBlockArchitecture(
  definition: BlockArchitectureDefinition
): BlockArchitecture {
  const files = new Map(
    (definition.files ?? []).map((file) => [installationPath(file), file] as const)
  )
  const resources = new Map<string, ArchitectureResource>()
  for (const [path, file] of files) {
    const edgeFunction = path.match(/^(.*?supabase\/functions\/([^/]+))\//)
    if (edgeFunction && !edgeFunction[2].startsWith('_')) {
      const id = `edge-function:${edgeFunction[1]}`
      const existing = resources.get(id)
      if (existing) {
        existing.files.push(path)
      } else {
        resources.set(id, {
          id,
          kind: 'edge-function',
          label: edgeFunction[2],
          description: edgeFunction[1],
          status: 'added',
          files: [path],
        })
      }
      continue
    }
    const classification = classify(path, file.type)
    const id = `${classification.kind}:${path}`
    resources.set(id, {
      id,
      ...classification,
      label: classification.route ?? path.split('/').pop() ?? path,
      description: path,
      status: 'added',
      files: [path],
    })
  }

  // A declaration can group installed files into one resource or add a resource
  // created by setup instructions, such as a database table or storage bucket.
  const replacements = new Map<string, string>()
  for (const declared of definition.meta?.architecture?.resources ?? []) {
    const declaredFiles = declared.files?.map(normalizePath)
    const previous = resources.get(declared.id)
    const resource: ArchitectureResource = {
      ...previous,
      ...declared,
      description: declared.description ?? previous?.description ?? '',
      status: declared.status ?? previous?.status ?? 'added',
      files: declaredFiles ?? previous?.files ?? [],
    }
    if (declaredFiles?.length) {
      for (const [id, derived] of resources) {
        if (id !== declared.id && derived.files.some((file) => declaredFiles.includes(file))) {
          const remaining = derived.files.filter((file) => !declaredFiles.includes(file))
          if (remaining.length) derived.files = remaining
          else {
            resources.delete(id)
            replacements.set(id, declared.id)
          }
        }
      }
    }
    resources.set(declared.id, resource)
  }

  const relationships = new Map<string, ArchitectureRelationship>()
  for (const relationship of definition.meta?.architecture?.relationships ?? []) {
    const source = replacements.get(relationship.source) ?? relationship.source
    const target = replacements.get(relationship.target) ?? relationship.target
    if (!resources.has(source) || !resources.has(target) || source === target) continue
    const label = relationship.label ?? ''
    const id = JSON.stringify([source, target, label])
    relationships.set(id, { id, source, target, label })
  }

  return {
    name: definition.name,
    title: definition.title ?? definition.name,
    description: definition.description,
    resources: Array.from(resources.values()),
    relationships: Array.from(relationships.values()),
    fileCount: files.size,
  }
}

function readableLabel(resource: ArchitectureResource): string {
  if (!resource.label.startsWith('/') && !extension.test(resource.label)) return resource.label
  const name = resource.label.startsWith('/')
    ? resource.label.split('/').filter(Boolean).pop() || 'Home'
    : resource.label.replace(extension, '')
  const words = name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/\blogin\b/i, 'sign in')
    .replace(/\blogout\b/i, 'sign out')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** Keep the overview about application structure; the registry tree covers implementation files. */
export function summarizeBlockArchitecture(architecture: BlockArchitecture): BlockArchitecture {
  const visibleKinds: ArchitectureResourceKind[] = [
    'page',
    'route',
    'layout',
    'middleware',
    'component',
    'edge-function',
    'table',
    'bucket',
    'service',
    'capability',
  ]
  const resources = architecture.resources
    .filter((resource) => visibleKinds.includes(resource.kind))
    .map((resource) => ({
      ...resource,
      label: readableLabel(resource),
      // Source paths remain in the definition and file tree, not the conceptual overview.
      description: resource.files.includes(resource.description)
        ? ''
        : resource.description.replace(/^\S+\.(?:sql|tsx?|dart)\s+—\s*/, ''),
    }))

  if (!resources.some((resource) => resource.status === 'added')) {
    resources.unshift({
      id: `capability:${architecture.name}`,
      kind: 'capability',
      label: architecture.title,
      description: architecture.description ?? '',
      status: 'added',
      files: [],
    })
  }

  const ids = new Set(resources.map((resource) => resource.id))
  return {
    ...architecture,
    resources,
    relationships: architecture.relationships.filter(
      (relationship) => ids.has(relationship.source) && ids.has(relationship.target)
    ),
  }
}
