import React from 'react'

import { serverWatcher } from './container'
import { useSubscription } from './watcher'
import { stopServer } from './runner'
import { setCurrentPath } from './file-system'

import { Editor } from './Editor'
import { FilesPanel } from './FilesPanel'
import { XTerm } from './Terminal'
import CodeBlock from '../CodeBlock/CodeBlock'

export function GoToFile({ path }) {
  return (
    <button
      className="underline decoration-green-400 decoration-dotted underline-offset-[3px]"
      onClick={() => setCurrentPath(path)}
    >
      {path.startsWith('/') ? path.slice(1) : path}
    </button>
  )
}

export function Code({ children, language }) {
  return (
    <CodeBlock language={language} className="language-js" hideLineNumbers={false}>
      {children}
    </CodeBlock>
  )
}

export function Playground() {
  const serverUrl = useSubscription(serverWatcher)

  return (
    <div className="flex flex-col h-full gap-3" style={{ colorScheme: 'dark' }}>
      <FullEditor />
      {serverUrl ? <Preview serverUrl={serverUrl} /> : null}
      <Terminal hide={serverUrl} />
    </div>
  )
}

function Terminal({ hide }) {
  return (
    <div
      className={`${hide ? 'hidden' : 'block'} rounded overflow-hidden`}
      style={{ background: '#232323' }}
    >
      <div className="text-gray-900 px-2 py-1 text-sm">Terminal</div>
      <XTerm className="h-96 pl-2" />
    </div>
  )
}

function Preview({ serverUrl }) {
  return (
    <div className={` rounded overflow-hidden`} style={{ background: '#232323' }}>
      <div className="text-neutral-300  px-2 py-1 text-smn justify-between flex">
        <span />
        <span className="rounded bg-neutral-900 px-3 text-neutral-400">{serverUrl}</span>
        <button onClick={() => stopServer()}>Stop</button>
      </div>
      <iframe src={serverUrl} className="border-none h-96 w-full" />
    </div>
  )
}

function FullEditor() {
  return (
    <div className="flex-1  flex min-h-0 rounded overflow-hidden">
      <FilesPanel />
      <Editor className="w-full h-full  text-white min-w-0" />
    </div>
  )
}
