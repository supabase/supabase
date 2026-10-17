import { sep } from 'node:path'

export function normalizeRepoPath(filePath: string): string {
  return filePath.replaceAll('\\', '/')
}

export function parseChangedFilesList(input: string): string[] {
  return input
    .split(/[\n,]/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => normalizeRepoPath(line.split(sep).join('/')))
}

export function parsePagePaths(raw: string | undefined): string[] {
  if (!raw?.trim()) return []
  return raw
    .split(/[\n,]/)
    .map((path) => path.trim())
    .filter(Boolean)
    .map((path) => (path.startsWith('/') ? path : `/${path}`))
}
