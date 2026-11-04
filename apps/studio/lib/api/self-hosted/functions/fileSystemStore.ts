import type { Dirent } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { FunctionArtifact, FunctionFileEntry } from './types'

export class FileSystemFunctionsArtifactStore {
  constructor(private folderPath: string) {}

  async getFunctions(): Promise<FunctionArtifact[]> {
    let dirEntries
    try {
      dirEntries = await readdir(this.folderPath, { withFileTypes: true })
    } catch (error) {
      if (isNotFound(error)) return []
      throw error
    }

    const functionsFolders = dirEntries.filter((dir) => dir.isDirectory() && dir.name !== 'main')
    const functionsArtifacts = await Promise.all(
      functionsFolders.map(parseFolderToFunctionArtifact)
    )

    return functionsArtifacts.filter((f) => f !== undefined)
  }

  async getFunctionBySlug(slug: string): Promise<FunctionArtifact | undefined> {
    let dirEntries
    try {
      dirEntries = await readdir(this.folderPath, { withFileTypes: true })
    } catch (error) {
      if (isNotFound(error)) return
      throw error
    }

    const functionFolder = dirEntries.find(
      (dir) => dir.isDirectory() && dir.name !== 'main' && dir.name === slug
    )
    if (!functionFolder) return

    return parseFolderToFunctionArtifact(functionFolder)
  }

  async getFileEntriesBySlug(slug: string): Promise<Array<FunctionFileEntry>> {
    if (slug === 'main') return []

    const functionFolderPath = path.resolve(this.folderPath, slug)
    if (!functionFolderPath.startsWith(path.resolve(this.folderPath) + path.sep)) return []

    let entries
    try {
      entries = await readdir(functionFolderPath, {
        recursive: true,
        withFileTypes: true,
      })
    } catch (error) {
      if (isNotFound(error)) return []
      throw error
    }

    const fileEntries = await Promise.all(
      entries
        .filter((entry) => entry.isFile())
        .map(async (entry) => {
          const absolutePath = path.join(entry.parentPath, entry.name)
          const fileStat = await stat(absolutePath)
          return {
            absolutePath,
            relativePath: path.relative(functionFolderPath, absolutePath),
            size: fileStat.size,
          }
        })
    )

    return fileEntries
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

function isNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'ENOENT'
  )
}
