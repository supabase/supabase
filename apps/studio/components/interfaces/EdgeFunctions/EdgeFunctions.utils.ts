import { common, dirname, relative } from '@std/path/posix'

import { EdgeFunctionBodyData } from '@/data/edge-functions/edge-function-body-query'
import { EdgeFunctionFile } from './EdgeFunction.types'

export const getFallbackImportMapPath = (files: Omit<EdgeFunctionFile, 'id' | 'content'>[]) => {
  // try to find a deno.json or import_map.json file
  const regex = /^.*?(deno|import_map).json*$/i
  return files.find(({ name }) => regex.test(name))?.name
}

export const getFallbackEntrypointPath = (files: Omit<EdgeFunctionFile, 'id' | 'content'>[]) => {
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

export const getStaticPatterns = (files: Omit<EdgeFunctionFile, 'id' | 'content'>[]) => {
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
  files,
}: {
  functionBody: EdgeFunctionBodyData
  entrypointPath?: string
  files: EdgeFunctionFile[]
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
          const common_path = common([base_path, file.name])
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
      const prevState = files.find((x) => x.name === file.name)
      return {
        id: index + 1,
        name: file.name,
        content: file.content,
        selected: prevState?.selected ?? index === 0,
      }
    })
  }

  return []
}

/**
 * Checks up to 2 levels deep (as a best check, not perfect) if
 * 1. Mentioned in index.ts
 * 2. Any file that's imported by index.ts imports this file
 */
export const checkUnimportedFiles = (files: EdgeFunctionFile[]): string[] => {
  const indexFile = files.find((file) => file.name === 'index.ts')
  if (!indexFile || files.length <= 1) {
    return []
  }

  const unimportedFiles: string[] = []

  files.forEach((file) => {
    if (file.name === 'index.ts') return

    const fileNameWithoutExt = file.name.replace('.ts', '')
    if (indexFile.content.includes(fileNameWithoutExt)) return

    const level1Files = files.filter((f) => {
      if (f.name === 'index.ts' || f.name === file.name) return false
      return indexFile.content.includes(f.name.replace('.ts', ''))
    })

    const isImportedAtLevel2 = level1Files.some((f) => f.content.includes(fileNameWithoutExt))

    if (!isImportedAtLevel2) unimportedFiles.push(file.name)
  })

  return unimportedFiles
}
