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
