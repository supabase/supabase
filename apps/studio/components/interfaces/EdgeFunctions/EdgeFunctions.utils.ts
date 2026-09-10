import { FileData } from '@/components/ui/FileExplorerAndEditor/FileExplorerAndEditor.types'
import { EdgeFunctionBodyData } from '@/data/edge-functions/edge-function-body-query'

// This file is bundled for both the browser (Next.js/webpack) and the TanStack Start (Vite) client,
// which handle Node.js builtins differently — Vite stubs `path` out entirely for the browser, so
// `path.posix` is undefined at runtime there even though it type-checks and builds fine under webpack.
// These are self-contained posix path helpers (no `path` import) so behavior is identical everywhere.
// Ported from the POSIX implementations in @std/path (JSR), which this file used to depend on directly.

function isPosixSeparator(code: number | undefined): boolean {
  return code === 47 /* '/' */
}

function stripTrailingSeparators(segment: string): string {
  if (segment.length <= 1) return segment
  let end = segment.length
  for (let i = segment.length - 1; i > 0; i--) {
    if (isPosixSeparator(segment.charCodeAt(i))) end = i
    else break
  }
  return segment.slice(0, end)
}

// Resolves "." and ".." segments in a posix path.
function normalizeString(path: string, allowAboveRoot: boolean): string {
  let res = ''
  let lastSegmentLength = 0
  let lastSlash = -1
  let dots = 0
  let code: number | undefined

  for (let i = 0; i <= path.length; ++i) {
    if (i < path.length) code = path.charCodeAt(i)
    else if (isPosixSeparator(code)) break
    else code = 47

    if (isPosixSeparator(code)) {
      if (lastSlash === i - 1 || dots === 1) {
        // noop
      } else if (lastSlash !== i - 1 && dots === 2) {
        if (
          res.length < 2 ||
          lastSegmentLength !== 2 ||
          res.charCodeAt(res.length - 1) !== 46 /* '.' */ ||
          res.charCodeAt(res.length - 2) !== 46 /* '.' */
        ) {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf('/')
            if (lastSlashIndex === -1) {
              res = ''
              lastSegmentLength = 0
            } else {
              res = res.slice(0, lastSlashIndex)
              lastSegmentLength = res.length - 1 - res.lastIndexOf('/')
            }
            lastSlash = i
            dots = 0
            continue
          } else if (res.length === 2 || res.length === 1) {
            res = ''
            lastSegmentLength = 0
            lastSlash = i
            dots = 0
            continue
          }
        }
        if (allowAboveRoot) {
          res += res.length > 0 ? '/..' : '..'
          lastSegmentLength = 2
        }
      } else {
        res += res.length > 0 ? '/' + path.slice(lastSlash + 1, i) : path.slice(lastSlash + 1, i)
        lastSegmentLength = i - lastSlash - 1
      }
      lastSlash = i
      dots = 0
    } else if (code === 46 /* '.' */ && dots !== -1) {
      ++dots
    } else {
      dots = -1
    }
  }

  return res
}

// Normalizes an absolute posix path (resolves "." / ".."). Assumes `path` starts with "/".
function resolveAbsolute(path: string): string {
  const normalized = normalizeString(path, false)
  return normalized.length > 0 ? '/' + normalized : '/'
}

function dirname(path: string): string {
  if (path.length === 0) return '.'

  let end = -1
  let matchedNonSeparator = false
  for (let i = path.length - 1; i >= 1; --i) {
    if (isPosixSeparator(path.charCodeAt(i))) {
      if (matchedNonSeparator) {
        end = i
        break
      }
    } else {
      matchedNonSeparator = true
    }
  }

  if (end === -1) return isPosixSeparator(path.charCodeAt(0)) ? '/' : '.'
  return stripTrailingSeparators(path.slice(0, end))
}

// `from`/`to` must be absolute (leading "/"). Returns the relative path from `from` to `to`.
function relative(from: string, to: string): string {
  from = resolveAbsolute(from)
  to = resolveAbsolute(to)
  if (from === to) return ''

  let fromStart = 1
  const fromEnd = from.length
  for (; fromStart < fromEnd; ++fromStart) {
    if (!isPosixSeparator(from.charCodeAt(fromStart))) break
  }
  const fromLen = fromEnd - fromStart

  let toStart = 1
  const toEnd = to.length
  for (; toStart < toEnd; ++toStart) {
    if (!isPosixSeparator(to.charCodeAt(toStart))) break
  }
  const toLen = toEnd - toStart

  const length = fromLen < toLen ? fromLen : toLen
  let lastCommonSep = -1
  let i = 0
  for (; i <= length; ++i) {
    if (i === length) {
      if (toLen > length) {
        if (isPosixSeparator(to.charCodeAt(toStart + i))) {
          return to.slice(toStart + i + 1)
        } else if (i === 0) {
          return to.slice(toStart + i)
        }
      } else if (fromLen > length) {
        if (isPosixSeparator(from.charCodeAt(fromStart + i))) {
          lastCommonSep = i
        } else if (i === 0) {
          lastCommonSep = 0
        }
      }
      break
    }
    const fromCode = from.charCodeAt(fromStart + i)
    const toCode = to.charCodeAt(toStart + i)
    if (fromCode !== toCode) break
    else if (isPosixSeparator(fromCode)) lastCommonSep = i
  }

  let out = ''
  for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
    if (i === fromEnd || isPosixSeparator(from.charCodeAt(i))) {
      out += out.length === 0 ? '..' : '/..'
    }
  }

  if (out.length > 0) return out + to.slice(toStart + lastCommonSep)

  let start = toStart + lastCommonSep
  if (isPosixSeparator(to.charCodeAt(start))) ++start
  return to.slice(start)
}

// Longest common path prefix across `paths`, comparing "/"-separated segments.
function commonPath(paths: string[]): string {
  const [first = '', ...rest] = paths
  const parts = first.split('/')
  let endOfPrefix = parts.length
  let append = ''

  for (const p of rest) {
    const compare = p.split('/')
    if (compare.length <= endOfPrefix) {
      endOfPrefix = compare.length
      append = ''
    }
    for (let i = 0; i < endOfPrefix; i++) {
      if (compare[i] !== parts[i]) {
        endOfPrefix = i
        append = i === 0 ? '' : '/'
        break
      }
    }
  }

  return parts.slice(0, endOfPrefix).join('/') + append
}

export const getFallbackImportMapPath = (files: Omit<FileData, 'id' | 'content' | 'state'>[]) => {
  // try to find a deno.json or import_map.json file
  const regex = /^.*?(deno|import_map).json*$/i
  return files.find(({ name }) => regex.test(name))?.name
}

export const getFallbackEntrypointPath = (files: Omit<FileData, 'id' | 'content' | 'state'>[]) => {
  // when there's no matching entrypoint path is set,
  // we use few heuristics to find an entrypoint file
  // 1. If the function has only a single TS / JS file, if so set it as entrypoint
  const jsFiles = files.filter(
    ({ name }) =>
      name.endsWith('.js') || name.endsWith('.ts') || name.endsWith('.jsx') || name.endsWith('.tsx')
  )
  if (jsFiles.length === 1) {
    return jsFiles[0].name
  } else if (jsFiles.length) {
    // 2. If function has a `index` or `main` file use it as the entrypoint
    const regex = /^.*?(index|main).*$/i
    const matchingFile = jsFiles.find(({ name }) => regex.test(name))
    // 3. if no valid index / main file found, we set the entrypoint expliclty to first JS file
    return matchingFile ? matchingFile.name : jsFiles[0].name
  } else {
    // no potential entrypoint files found, this will most likely result in an error on deploy
    return 'index.ts'
  }
}

export const getStaticPatterns = (files: Omit<FileData, 'id' | 'content' | 'state'>[]) => {
  return files
    .filter(({ name }) => !name.match(/\.(js|ts|jsx|tsx|json|wasm)$/i))
    .map(({ name }) => name)
}

function getBasePath(entrypoint: string | undefined, fileNames: string[]): string {
  if (!entrypoint) {
    return '/'
  }

  let candidate = fileNames.find((name) => entrypoint.endsWith(name))

  if (candidate) {
    return dirname(candidate)
  } else {
    try {
      return dirname(new URL(entrypoint).pathname)
    } catch (e) {
      console.error('Failed to parse entrypoint', entrypoint)
      return '/'
    }
  }
}

export const formatFunctionBodyToFiles = ({
  functionBody,
  entrypointPath,
}: {
  functionBody: EdgeFunctionBodyData
  entrypointPath?: string
}) => {
  const entrypoint_path = functionBody.metadata?.deno2_entrypoint_path ?? entrypointPath

  // Set files from API response when available
  if (entrypoint_path) {
    const base_path = getBasePath(
      entrypoint_path,
      functionBody.files.map((file) => file.name)
    )
    const filesWithRelPath = functionBody.files
      // set file paths relative to entrypoint
      .map((file: { name: string; content: string }) => {
        try {
          // if the current file and base path doesn't share a common path,
          // return unmodified file
          const common_path = commonPath([base_path, file.name])
          if (common_path === '' || common_path === '/tmp/') {
            return file
          }

          // prepend "/" to turn relative paths to absolute
          file.name = relative('/' + base_path, '/' + file.name)
          return file
        } catch (e) {
          console.error(e)
          // return unmodified file
          return file
        }
      })

    return filesWithRelPath.map((file: { name: string; content: string }, index: number) => {
      return {
        id: index + 1,
        name: file.name,
        content: file.content,
        state: 'unchanged',
      } as FileData
    })
  }

  return []
}
