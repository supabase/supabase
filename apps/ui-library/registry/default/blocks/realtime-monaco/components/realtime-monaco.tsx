'use client'

import { Editor } from '@monaco-editor/react'
import { SupabasePersistenceOptions } from '@supabase-labs/y-supabase'
import { Awareness } from 'y-protocols/awareness.js'

import { useConnectOnMount } from '../hooks/use-connect-on-mount'

type RealtimeMonacoProps = {
  channel: string
  language?: string
  height?: string | number
  className?: string
  awareness?: boolean | Awareness
  persistence?: boolean | SupabasePersistenceOptions
  theme?: 'light' | 'dark'
}

const DEFAULT_HEIGHT = 550

const RealtimeMonaco = ({
  channel,
  language = 'javascript',
  height = DEFAULT_HEIGHT,
  awareness = true,
  persistence,
  theme,
  ...rest
}: RealtimeMonacoProps) => {
  const { connectOnMount } = useConnectOnMount({ channel, persistence, awareness })

  return (
    <Editor
      height={height}
      language={language}
      theme={theme === 'dark' ? 'vs-dark' : 'light'}
      onMount={connectOnMount}
      {...rest}
    />
  )
}

export { RealtimeMonaco }
