import type { Dirent } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { FunctionArtifact } from './types'

export class FileSystemFunctionsArtifactStore {
  constructor(private folderPath: string) {}

  async getFunctions(): Promise<FunctionArtifact[]> {
    const dirEntries = await readdir(this.folderPath, { withFileTypes: true })

    const functionsFolders = dirEntries.filter((dir) => dir.isDirectory() && dir.name !== 'main')
    const functionsArtifacts = await Promise.all(
      functionsFolders.map(parseFolderToFunctionArtifact)
    )

    return functionsArtifacts.filter((f) => f !== undefined)
  }

  async getFunctionBySlug(slug: string): Promise<FunctionArtifact | undefined> {
    const dirEntries = await readdir(this.folderPath, { withFileTypes: true })

    const functionFolder = dirEntries.find(
      (dir) => dir.isDirectory() && dir.name !== 'main' && dir.name === slug
    )
    if (!functionFolder) return

    return parseFolderToFunctionArtifact(functionFolder)
  }
}

async function parseFolderToFunctionArtifact(
  folder: Dirent
): Promise<FunctionArtifact | undefined> {
  const folderPath = path.join(folder.parentPath, folder.name)
  const files = await readdir(folderPath, { withFileTypes: true })
  const entrypoint = files.find((file) => file.isFile() && file.name.startsWith('index'))

  if (!entrypoint) return

  const entrypointPath = path.join(folderPath, entrypoint.name)
  const entrypointStat = await stat(entrypointPath)

  return {
    slug: folder.name,
    entrypoint_path: pathToFileURL(entrypointPath).href,
    created_at: entrypointStat.birthtimeMs,
    updated_at: entrypointStat.mtimeMs,
  }
}
