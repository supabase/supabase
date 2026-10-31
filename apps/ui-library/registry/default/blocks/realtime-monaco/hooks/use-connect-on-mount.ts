'use client'

import { SupabasePersistenceOptions, SupabaseProvider } from '@supabase-labs/y-supabase'
import type { editor as MonacoEditor } from 'monaco-editor'
import { useCallback, useEffect, useRef } from 'react'
import { MonacoBinding } from 'y-monaco'
import { Awareness } from 'y-protocols/awareness'
import * as Y from 'yjs'

import { createClient } from '@/registry/default/clients/nextjs/lib/supabase/client'

type UseConnectOnMountOptions = {
  channel: string
  persistence?: boolean | SupabasePersistenceOptions
  awareness?: boolean | Awareness
}

const generateRandomColor = () => `hsl(${Math.floor(Math.random() * 360)}, 80%, 60%)`

export function useConnectOnMount({
  channel,
  persistence,
  awareness = true,
}: UseConnectOnMountOptions) {
  const docRef = useRef<Y.Doc | null>(null)
  const providerRef = useRef<SupabaseProvider | null>(null)
  const bindingRef = useRef<MonacoBinding | null>(null)
  const userRef = useRef<{ color: string } | null>(null)
  const styleRef = useRef<HTMLStyleElement | null>(null)
  const awarenessHandlerRef = useRef<(() => void) | null>(null)

  const connectOnMount = useCallback(
    (editor: MonacoEditor.IStandaloneCodeEditor) => {
      if (bindingRef.current) return

      const model = editor.getModel()
      if (!model) return

      const doc = new Y.Doc()
      const yText = doc.getText('monaco')
      const supabase = createClient()
      const provider = new SupabaseProvider(channel, doc, supabase as any, {
        awareness,
        persistence,
      })
      const providerAwareness = provider.getAwareness()

      if (providerAwareness) {
        if (!userRef.current) {
          userRef.current = {
            color: generateRandomColor(),
          }
        }
        providerAwareness.setLocalStateField('user', userRef.current)

        const applyAwarenessStyles = () => {
          if (!styleRef.current) {
            styleRef.current = document.createElement('style')
            styleRef.current.setAttribute('data-monaco-y-cursors', 'true')
            document.head.appendChild(styleRef.current)
          }

          let css = `
            .yRemoteSelection {
              background-color: var(--y-remote-selection-color, rgba(0, 0, 0, 0.2));
              opacity: 0.2;
            }
            .yRemoteSelectionHead {
              border-left: 2px solid var(--y-remote-selection-color, rgba(0, 0, 0, 0.7));
              margin-left: -1px;
              box-sizing: border-box;
            }
          `

          providerAwareness.getStates().forEach((state, clientId) => {
            const color = state?.user?.color
            const isValidHsl = /^hsl\(\d{1,3},\s*\d{1,3}%,\s*\d{1,3}%\)$/.test(color)

            if (!isValidHsl) return
            if (!color) return

            css += `
              .yRemoteSelection-${clientId}, .yRemoteSelectionHead-${clientId} {
                --y-remote-selection-color: ${color};
              }
            `
          })

          styleRef.current.textContent = css
        }

        awarenessHandlerRef.current = applyAwarenessStyles
        applyAwarenessStyles()
        providerAwareness.on('update', applyAwarenessStyles)
      }

      docRef.current = doc
      providerRef.current = provider
      bindingRef.current = new MonacoBinding(yText, model, new Set([editor]), providerAwareness)
    },
    [channel]
  )

  useEffect(() => {
    return () => {
      if (awarenessHandlerRef.current && providerRef.current) {
        const awareness = providerRef.current.getAwareness()
        awareness?.off('update', awarenessHandlerRef.current)
      }
      styleRef.current?.remove()
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
