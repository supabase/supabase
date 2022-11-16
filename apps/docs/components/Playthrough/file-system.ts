import * as x from './container'
import { currentFileWatcher, fileTreeWatcher } from './store'

type FileTree = FileTreeEntry[]
type DirEntry = {
  name: string
  path: string
  type: 'directory'
  children: FileTreeEntry[]
}
type FileEntry = {
  name: string
  path: string
  type: 'file'
}
type FileTreeEntry = FileEntry | DirEntry

export async function setCurrentPath(path: string) {
  const contents = await readFile(path)
  currentFileWatcher.notify({ path, contents })
}

export async function refreshFileTree() {
  const tree = await getFileTreeFrom('')
  fileTreeWatcher.notify(tree)
}

async function getFileTreeFrom(path: string): Promise<FileTree> {
  const dirs = ['pages', 'components', 'styles']
  const ignore = ['node_modules', '.next', '.gitignore', 'package-lock.json', 'README.md', 'api']
  let treeFiles: FileEntry[] = []
  let treeDirs: DirEntry[] = []
  const files = await x.readDir(path)
  const promises = files.map(async (file) => {
    if (ignore.includes(file)) {
      return
    }
    if (dirs.includes(file)) {
      treeDirs.push({
        name: file,
        path: path + '/' + file,
        type: 'directory',
        children: await getFileTreeFrom(file),
      })
    } else {
      treeFiles.push({
        name: file,
        path: path + '/' + file,
        type: 'file',
      })
    }
  })
  await Promise.all(promises)
  return [...treeDirs, ...treeFiles]
}
export async function readFile(path: string) {
  try {
    return await x.readFile(path)
  } catch (e) {
    return undefined
  }
}

let dirtyFiles: Record<string, string> = {}
export function updateDraft(path: string, contents: string) {
  dirtyFiles[path] = contents
}

export async function saveFile(path: string, contents: string) {
  console.log('saving file', path, currentFileWatcher.get())
  const safePath = path.startsWith('/') ? path.slice(1) : path

  const result = await x.saveFile(safePath, contents)

  const currentPath = currentFileWatcher.get()?.path
  const currentSafePath = currentPath?.startsWith('/') ? currentPath.slice(1) : currentPath

  if (currentSafePath === path) {
    currentFileWatcher.notify({ path, contents })
  }
  refreshFileTree()
  return result
}

export async function saveDraft(path: string) {
  const contents = dirtyFiles[path]
  if (contents != null) {
    saveFile(path, contents)
  }
  delete dirtyFiles[path]
}
