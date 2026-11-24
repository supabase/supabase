import { glob } from 'fs/promises'
import { join, posix, relative, sep } from 'path'
import _routerMock from 'next-router-mock'
import { createDynamicRouteParser } from 'next-router-mock/dynamic-routes'

export const routerMock = _routerMock

const routesRoot = join(process.cwd(), 'routes')

// `_app/org/$slug/general.tsx` → `/org/[slug]/general`, so `next/router` mocks parse
// dynamic segments the way the app's routes define them.
const toNextRoutePattern = (file: string) =>
  `/${relative(routesRoot, file)
    .replaceAll(sep, posix.sep)
    .replace(/\.tsx$/, '')
    .split('/')
    .filter((segment) => segment !== 'index' && !(segment.startsWith('_') && segment.length > 1))
    .map((segment) => (segment.startsWith('$') ? `[${segment.slice(1)}]` : segment))
    .join('/')}`

// Dynamic leaf routes (`$id.tsx`) and index routes under a dynamic segment.
const isDynamicRouteFile = (file: string) => {
  const segments = relative(routesRoot, file).split(sep)
  const fileName = segments.at(-1) ?? ''
  const isDynamicLeaf = /^\$[a-zA-Z]/.test(fileName)
  const isIndexUnderDynamicSegment =
    fileName === 'index.tsx' && segments.some((segment) => segment.startsWith('$'))
  return segments[0] !== 'api' && (isDynamicLeaf || isIndexUnderDynamicSegment)
}

const paths = (await Array.fromAsync(glob(`${routesRoot}/**/*.tsx`)))
  .filter(isDynamicRouteFile)
  .map(toNextRoutePattern)

routerMock.useParser(createDynamicRouteParser(paths))
