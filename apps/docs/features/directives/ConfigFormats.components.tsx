'use client'

import { useSyncExternalStore, type PropsWithChildren } from 'react'

import { CodeTabs } from './CodeTabs.components'

const STORAGE_KEY = 'supabase-docs:config-format'
const CHANGE_EVENT = 'supabase-docs:config-format-change'
const TOML = 'supabase/config.toml'
const FORMATS = [TOML, 'supabase/config.jsonc']

let memoryFormat = TOML

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

function getSnapshot() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored && FORMATS.includes(stored) ? stored : memoryFormat
  } catch {
    return memoryFormat
  }
}

function getServerSnapshot() {
  return TOML
}

function setFormat(value: string) {
  memoryFormat = value
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // Storage unavailable: the preference only applies until reload
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function ConfigCodeTabs({ children }: PropsWithChildren) {
  const format = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  return (
    <CodeTabs value={format} onValueChange={setFormat}>
      {children}
    </CodeTabs>
  )
}
