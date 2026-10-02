import * as fs from 'node:fs/promises'
import path from 'node:path'

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true })
}

export async function ensureFile(filePath: string): Promise<void> {
  await ensureDir(path.dirname(filePath))

  // Open in append mode so missing files are created without truncating existing ones.
  const handle = await fs.open(filePath, 'a')
  await handle.close()
}

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

export async function removePath(filePath: string): Promise<void> {
  await fs.rm(filePath, { recursive: true, force: true })
}
