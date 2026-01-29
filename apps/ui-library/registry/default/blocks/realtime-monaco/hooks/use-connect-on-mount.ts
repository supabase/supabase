'use client'

import type { editor as MonacoEditor } from 'monaco-editor'
import { useCallback, useEffect, useRef } from 'react'
import { MonacoBinding } from 'y-monaco'
import { SupabaseProvider } from '@tiagoantunespt/y-supabase'
import { createClient } from '@/registry/default/clients/nextjs/lib/supabase/client'
import * as Y from 'yjs'

type UseConnectOnMountOptions = {
  channel: string
}

export function useConnectOnMount({ channel }: UseConnectOnMountOptions) {
  const docRef = useRef<Y.Doc | null>(null)
  const providerRef = useRef<SupabaseProvider | null>(null)
  const bindingRef = useRef<MonacoBinding | null>(null)

  const connectOnMount = useCallback(
    (editor: MonacoEditor.IStandaloneCodeEditor) => {
      if (bindingRef.current) return

      const model = editor.getModel()
      if (!model) return

      const doc = new Y.Doc()
      const yText = doc.getText('monaco')
      const supabase = createClient()
      const provider = new SupabaseProvider(channel, doc, supabase as any)

      docRef.current = doc
      providerRef.current = provider

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

  return { connectOnMount }
}
