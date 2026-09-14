import { exportedNames, sourceTokens, tanstackDeclaration } from './source-tokens'
import type {
  ProjectFile,
  ProjectFramework,
  ProjectResource,
  ProjectResourceDiagnostic,
} from './types'

function routePath(parts: string[]): string {
  return (
    '/' +
    parts
      .filter(Boolean)
      .map((part) =>
        part
          .replace(/^\[\[\.\.\.(.+)\]\]$/, ':$1*')
          .replace(/^\[\.\.\.(.+)\]$/, ':$1*')
          .replace(/^\[\[(.+)\]\]$/, ':$1?')
          .replace(/^\[(.+)\]$/, ':$1')
          .replace(/^\$(.+)$/, ':$1')
          .replace(/^\$$/, '*')
      )
      .join('/')
  )
}

function withoutIndex(parts: string[]): string[] {
  return parts[parts.length - 1] === 'index' || parts[parts.length - 1] === '_index'
    ? parts.slice(0, -1)
    : parts
}

export function analyzeRoute(
  file: ProjectFile,
  framework: ProjectFramework,
  diagnostics: ProjectResourceDiagnostic[]
): ProjectResource[] {
  const add = (kind: 'page' | 'api-route', route: string): ProjectResource => ({
    id: `${kind}:${route}`,
    kind,
    name: route,
    route,
    files: [file.path],
  })
  const path = file.path.replace(/^src\//, '')
  if (framework === 'nextjs' || framework === 'generic') {
    const app = path.match(/^app\/(.*\/)?(page\.[jt]sx?|route\.[jt]s)$/)
    if (app) {
      const parts = (app[1] ?? '').split('/').filter(Boolean)
      // Slots and intercepting/private routes do not introduce independent public URLs.
      if (
        parts.some(
          (part) => part.startsWith('_') || part.startsWith('@') || /^\(\.{1,3}\)/.test(part)
        )
      )
        return []
      return [
        add(
          app[2].startsWith('route.') ? 'api-route' : 'page',
          routePath(parts.filter((part) => !/^\(.+\)$/.test(part)))
        ),
      ]
    }
    const pages = path.match(/^pages\/(.+)\.[jt]sx?$/)
    if (pages) {
      const parts = pages[1].split('/')
      if (/^_(?:app|document|error|middleware)$/.test(parts[parts.length - 1])) return []
      return [add(parts[0] === 'api' ? 'api-route' : 'page', routePath(withoutIndex(parts)))]
    }
  }
  if (framework === 'nuxt' || framework === 'generic') {
    const page = path.match(/^(?:app\/)?pages\/(.+)\.vue$/)
    if (page) {
      if (page[1].includes('@')) return [] // Named views share another page's URL.
      return [
        add(
          'page',
          routePath(withoutIndex(page[1].split('/').filter((part) => !/^\(.+\)$/.test(part))))
        ),
      ]
    }
    const server = path.match(/^server\/(api|routes)\/(.+)\.[cm]?[jt]s$/)
    if (server) {
      const handler = server[2].replace(
        /\.(?:get|post|put|patch|delete|head|options|connect|trace)$/,
        ''
      )
      const parts = withoutIndex(handler.split('/'))
      return [add('api-route', routePath(server[1] === 'api' ? ['api', ...parts] : parts))]
    }
  }
  if (framework === 'flutter' && /^lib\/pages\/.+\.dart$/.test(path)) {
    const name = path
      .split('/')
      .pop()!
      .replace(/\.dart$/, '')
    return [{ id: `page:${file.path}`, kind: 'page', name, files: [file.path] }]
  }
  if (framework !== 'tanstack' && framework !== 'react-router' && framework !== 'generic') return []
  const routeFile = path.match(/^(?:app\/)?routes\/(.+)\.[jt]sx?$/)
  if (!routeFile) return []
  const routeName = routeFile[1]
  if (routeName === '__root' || routeName.split(/[/.]/).some((part) => part.startsWith('-')))
    return []
  if (framework === 'react-router' && routeName.includes('/') && !/^[^/]+\/route$/.test(routeName))
    return []
  if (file.content === undefined) {
    diagnostics.push({
      code: 'missing-content',
      message: 'Route source is required to distinguish pages from server handlers and layouts.',
      files: [file.path],
    })
    return []
  }
  const tokens = sourceTokens(file.content)
  const declaration = tanstackDeclaration(tokens)
  if (framework === 'tanstack' || (framework === 'generic' && declaration)) {
    if (!declaration) {
      diagnostics.push({
        code: 'ambiguous-route',
        message: 'No supported static TanStack file-route declaration was found.',
        files: [file.path],
      })
      return []
    }
    const parts = declaration.route.split('/').filter(Boolean)
    if (parts[parts.length - 1]?.startsWith('_')) return []
    const route = routePath(
      withoutIndex(parts.filter((part) => !part.startsWith('_') && !/^\(.+\)$/.test(part)))
    )
    const resources: ProjectResource[] = []
    if (declaration.component) resources.push(add('page', route))
    if (declaration.server) resources.push(add('api-route', route))
    if (!resources.length)
      diagnostics.push({
        code: 'ambiguous-route',
        message: 'A route loader alone does not identify a page component or an API handler.',
        files: [file.path],
      })
    return resources
  }
  if (framework === 'react-router') {
    // This is the default @react-router/fs-routes convention; arbitrary routes.ts configuration is not evaluated.
    if (/[\[\]()]/.test(routeName)) {
      diagnostics.push({
        code: 'ambiguous-route',
        message:
          'Escaped or optional React Router filename segments require route configuration analysis.',
        files: [file.path],
      })
      return []
    }
    const parts = routeName.split(/[/.]/)
    if (parts[parts.length - 1] === 'route') parts.pop()
    if (parts[parts.length - 1]?.startsWith('_') && parts[parts.length - 1] !== '_index') return []
    const route = routePath(
      withoutIndex(
        parts
          .filter((part) => !part.startsWith('_') || part === '_index')
          .map((part) => part.replace(/_$/, ''))
      )
    )
    const exports = exportedNames(tokens)
    if (exports.has('default')) return [add('page', route)]
    if (exports.has('loader') || exports.has('action')) return [add('api-route', route)]
  }
  diagnostics.push({
    code: 'ambiguous-route',
    message:
      'The supplied file does not establish a page or API route under the selected framework conventions.',
    files: [file.path],
  })
  return []
}
