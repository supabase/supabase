'use client'

import { Editor } from '@monaco-editor/react'
import type { editor as MonacoEditor } from 'monaco-editor'
import { useCallback, useEffect, useRef } from 'react'
import { MonacoBinding } from 'y-monaco'
import { SupabaseProvider } from '@tiagoantunespt/y-supabase'
import { createClient } from '@/registry/default/clients/nextjs/lib/supabase/client'
import * as Y from 'yjs'

type RealtimeMonacoProps = {
  channel: string
  language?: string
  height?: string | number
  className?: string
  theme?: 'light' | 'dark'
}

const DEFAULT_HEIGHT = 550

const RealtimeMonaco = ({
  channel,
  language = 'javascript',
  height = DEFAULT_HEIGHT,
  theme,
  ...rest
}: RealtimeMonacoProps) => {
  const docRef = useRef<Y.Doc | null>(null)
  const providerRef = useRef<SupabaseProvider | null>(null)
  const bindingRef = useRef<MonacoBinding | null>(null)

  const handleMount = useCallback(
    (editor: MonacoEditor.IStandaloneCodeEditor) => {
      if (bindingRef.current) return

      const doc = new Y.Doc()
      const yText = doc.getText('monaco')
      const supabase = createClient()
      const provider = new SupabaseProvider(channel, doc, supabase)

      docRef.current = doc
      providerRef.current = provider

      const model = editor.getModel()
      if (!model) return

      bindingRef.current = new MonacoBinding(yText, model, new Set([editor]))
    },
    [channel]
  )

  useEffect(() => {
    return () => {
      bindingRef.current?.destroy()
      bindingRef.current = null
      providerRef.current?.destroy()
      providerRef.current = null
      docRef.current?.destroy()
      docRef.current = null
    }
  }, [])

  return (
    <Editor
      height={height}
      language={language}
      theme={theme === 'dark' ? 'vs-dark' : 'light'}
      onMount={handleMount}
      {...rest}
    />
  )
}

export default RealtimeMonaco
