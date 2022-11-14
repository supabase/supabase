import React from 'react'
import { saveDraft, setCurrentPath } from './file-system'
import { fileTreeWatcher, currentFileWatcher } from './store'
import { mergeWatchers, useSubscription } from './watcher'

export function FilesPanel() {
  const { entries, currentPath, isCurrentDirty } = useSubscription(entriesWatcher)
  return (
    <div className="bg-gray-900 w-56" style={{ background: '#232323' }}>
      <div className="text-gray-900 px-2 py-1 border-b text-sm border-gray-500 flex justify-between">
        <span className="">Files</span>
        <button
          className={`bg-gray-500 rounded px-2 transition-opacity ${
            isCurrentDirty ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => saveDraft(currentPath)}
        >
          Save
        </button>
      </div>
      {entries.map((entry) => (
        <EntryTree key={entry.name} entry={entry} />
      ))}
    </div>
  )
}

function EntryTree({ entry }: { entry: Entry }) {
  if (entry.type === 'file') {
    return (
      <div className="">
        <div
          className={`pl-2 text-gray-900 hover:text-white cursor-pointer ${
            entry.isDirty ? 'italic' : ''
          }`}
          style={{ color: entry.isActive ? 'rgb(63,207,142)' : undefined }}
          onClick={() => setCurrentPath(entry.path)}
        >
          {entry.name}
        </div>
      </div>
    )
  } else {
    return (
      <div className="">
        <div className="text-gray-800 pl-2">{entry.name}</div>
        <div className="flex flex-col pl-2">
          {entry.children.map((child) => (
            <EntryTree key={child.name} entry={child} />
          ))}
        </div>
      </div>
    )
  }
}

type Entry = FileEntry | DirEntry

type FileEntry = {
  type: 'file'
  name: string
  path: string
  isDirty: boolean
  isActive: boolean
}

type DirEntry = {
  type: 'dir'
  name: string
  path: string
  children: Entry[]
}

const entriesWatcher = mergeWatchers(fileTreeWatcher, currentFileWatcher, (fileTree, file) => {
  if (!fileTree)
    return {
      entries: [],
      currentPath: '',
      isCurrentDirty: true,
    }
  function mapEntry(entry) {
    if (entry.type === 'file') {
      return {
        type: 'file',
        name: entry.name,
        path: entry.path,
        isDirty: false,
        isActive: entry.path === file?.path,
      } as FileEntry
    } else {
      return {
        type: 'dir',
        name: entry.name,
        path: entry.path,
        children: entry.children.map(mapEntry),
      } as DirEntry
    }
  }
  return {
    currentPath: file?.path,
    isCurrentDirty: false,
    entries: fileTree.map((entry) => {
      return mapEntry(entry)
    }),
  }
})
