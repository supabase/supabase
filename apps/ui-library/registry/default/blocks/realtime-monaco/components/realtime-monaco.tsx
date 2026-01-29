'use client'

import { Editor } from '@monaco-editor/react'
import { useConnectOnMount } from '../hooks/use-connect-on-mount'

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
  const { connectOnMount } = useConnectOnMount({ channel })

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

export default RealtimeMonaco
