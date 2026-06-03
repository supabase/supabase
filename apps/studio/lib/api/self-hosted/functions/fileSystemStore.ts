import { createHash } from 'node:crypto'
import type { Dirent } from 'node:fs'
import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { FunctionArtifact, FunctionFileEntry } from './types'

/** Mirrors the slug validation used by the create-function form in the UI. */
const SLUG_REGEX = /^[A-Za-z0-9_-]+$/

/** Code files the edge runtime can use as a function entrypoint. */
const CODE_FILE_REGEX = /\.(ts|tsx|js|jsx|mjs)$/

/**
 * Derives a stable, UUID-formatted id from a function slug. Self-hosted has no
 * database row to provide an id, and generating a random one per request breaks
 * anything that keys off it (React lists, per-function log/stat filters). A hash
 * of the slug is deterministic across the list, detail and deploy endpoints.
 */
export function getStableFunctionId(slug: string): string {
  const hex = createHash('sha256').update(slug).digest('hex')
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-')
}

export class FileSystemFunctionsArtifactStore {
  constructor(private folderPath: string) {}

  /**
   * Resolves a path inside the artifact folder, throwing if the result would
   * escape the folder (path traversal). Used to keep both the function slug and
   * any file paths within the managed functions directory.
   */
  private resolveWithinFolder(...segments: string[]): string {
    const base = path.resolve(this.folderPath)
    const target = path.resolve(base, ...segments)
    if (target !== base && !target.startsWith(base + path.sep)) {
      throw new Error('Resolved path escapes the functions directory')
    }
    return target
  }

  /**
   * Writes (or replaces) a function's files on disk. The provided files
   * represent the full bundle, so the existing function folder is removed first
   * to drop any files that are no longer present. The edge runtime serves
   * functions from this folder on the next invocation, so no restart is needed.
   */
  async deployFunction(
    slug: string,
    files: Array<{ name: string; content: string }>
  ): Promise<FunctionArtifact> {
    if (!SLUG_REGEX.test(slug)) {
      throw new Error('Invalid function slug')
    }
    if (files.length === 0) {
      throw new Error('At least one file is required to deploy a function')
    }

    const functionFolderPath = this.resolveWithinFolder(slug)

    // Replace the whole bundle: clear out the previous version, then write anew.
    await rm(functionFolderPath, { recursive: true, force: true })
    await mkdir(functionFolderPath, { recursive: true })

    for (const file of files) {
      const targetPath = this.resolveWithinFolder(slug, file.name)
      await mkdir(path.dirname(targetPath), { recursive: true })
      await writeFile(targetPath, file.content, 'utf8')
    }

    // Prefer the canonical artifact (only resolves when an index* entrypoint
    // exists, matching how functions are listed) and fall back to building one
    // from the first written file so deploys still succeed for custom entrypoints.
    const artifact = await this.getFunctionBySlug(slug)
    if (artifact) return artifact

    const entrypoint = files.find((f) => path.basename(f.name).startsWith('index')) ?? files[0]
    const entrypointPath = this.resolveWithinFolder(slug, entrypoint.name)
    const entrypointStat = await stat(entrypointPath)
    return {
      slug,
      entrypoint_path: pathToFileURL(entrypointPath).href,
      created_at: entrypointStat.birthtimeMs,
      updated_at: entrypointStat.mtimeMs,
    }
  }

  /** Deletes a function's folder from disk. */
  async deleteFunction(slug: string): Promise<void> {
    if (!SLUG_REGEX.test(slug)) {
      throw new Error('Invalid function slug')
    }

    const functionFolderPath = this.resolveWithinFolder(slug)
    await rm(functionFolderPath, { recursive: true, force: true })
  }

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

  async getFileEntriesBySlug(slug: string): Promise<Array<FunctionFileEntry>> {
    if (slug === 'main') return []

    const functionFolderPath = path.resolve(this.folderPath, slug)
    if (!functionFolderPath.startsWith(path.resolve(this.folderPath) + path.sep)) return []

    const entries = await readdir(functionFolderPath, {
      recursive: true,
      withFileTypes: true,
    })

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

  // Prefer a conventional index.* entrypoint, then any index* file, then fall
  // back to the first code file so functions with custom entrypoints still show.
  const entrypoint =
    files.find((file) => file.isFile() && /^index\.(ts|tsx|js|jsx|mjs)$/.test(file.name)) ??
    files.find((file) => file.isFile() && file.name.startsWith('index')) ??
    files.find((file) => file.isFile() && CODE_FILE_REGEX.test(file.name))

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
