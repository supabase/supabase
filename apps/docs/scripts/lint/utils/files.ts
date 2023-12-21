import { stat } from 'node:fs/promises'
import { resolve } from 'node:path'

export async function isDirectory(pathname: string): Promise<boolean> {
  const resolvedPath = resolve(pathname)

  const fileStats = await stat(resolvedPath)
  return fileStats.isDirectory()
}
