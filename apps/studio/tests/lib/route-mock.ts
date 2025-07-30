import { glob } from 'fs/promises'
import _routerMock from 'next-router-mock'
import { createDynamicRouteParser } from 'next-router-mock/dynamic-routes'
import { normalize, posix, sep, join } from 'path'

export const routerMock = _routerMock

const pipe =
  <T>(...fns: Array<(arg: T) => T>) =>
  (value: T) =>
    fns.reduce((acc, fn) => fn(acc), value)
// normalize file paths to posix format (windows FS support)
const toPosix = (str: string) => str.replaceAll(sep, posix.sep)
const pagesRoot = toPosix(join(process.cwd(), `./pages`))
// remove the base filepath
const removePrefix = (str: string) => str.replace(pagesRoot, ``)
// remove the file extension or index segment
const removeExt = (str: string) => str.replace(/.tsx|\/index.tsx/, ``)

// Glob the `pages/` directory for all dynamic route segments
const paths = [
  ...(await Array.fromAsync(glob(`${pagesRoot}/**/*\].tsx`))),
  ...(await Array.fromAsync(glob(`${pagesRoot}/**/**\]/**/index.tsx`))),
].map(pipe(normalize, toPosix, removePrefix, removeExt))

routerMock.useParser(createDynamicRouteParser(paths))
