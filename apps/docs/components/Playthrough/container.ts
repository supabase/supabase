import { DirectoryEntry, FileSystemTree, load } from '@webcontainer/api'
import type { WebContainer } from '@webcontainer/api'
import { createWatcher } from './watcher'

let container: WebContainer = null as any
const containerPromise = new Promise((resolve) => {
  if (typeof window !== 'undefined') {
    window.requestIdleCallback(async () => {
      const WebContainer = await load()
      container = await WebContainer.boot()
      container.on('error', ({ message }) => console.error(message))
      resolve(container)

      // for debugging
      console.log('container ready')
      // @ts-ignore
      window.container = container

      // await saveFile(".env.local", "hello");
    })
  }
})

export async function readDir(path: string) {
  await containerPromise
  return container.fs.readdir(path)
}

export async function readFile(path: string) {
  await containerPromise
  return container.fs.readFile(path, 'utf8')
}

export async function saveFile(path: string, contents: string) {
  await containerPromise
  const parts = path.split('/')
  const filename = parts.pop()!
  let tree: FileSystemTree = {}
  let current = tree
  for (const part of parts) {
    const dir = { directory: {} } as DirectoryEntry
    current[part] = dir
    current = dir.directory
  }
  current[filename] = { file: { contents } }
  await container.loadFiles(tree)
}

export async function runLine(line: string, output: (data: string) => void) {
  await containerPromise
  const [command, ...args] = line.split(' ')
  const process = await container.run({ command, args }, { output })

  return {
    onDone: process.onExit,
    kill: () => process.kill(),
  }
}

export function onServerReady(callback: (port: number, url: string) => void) {
  let disposeFn: null | (() => void) = null
  const dispose = () => {
    containerPromise.then(() => {
      if (disposeFn) {
        disposeFn()
      }
    })
  }
  containerPromise.then(() => {
    disposeFn = container.on('server-ready', callback)
  })
  return dispose
}
export const serverWatcher = createWatcher<string>()

onServerReady((port, url) => {
  serverWatcher.notify(url)
})
