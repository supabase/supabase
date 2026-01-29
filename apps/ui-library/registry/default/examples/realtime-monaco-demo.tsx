'use client'

import { useTheme } from 'next-themes'
import dynamic from 'next/dynamic'

const Editor = dynamic(() => import('../blocks/realtime-monaco/components/realtime-monaco'), {
  ssr: false,
})

const RealtimeMonacoDemo = () => {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme?.includes('dark')

  return (
    <div className="p-4">
      <Editor
        channel="realtime-monaco-demo"
        language="typescript"
        theme={isDark ? 'dark' : 'light'}
      />
    </div>
  )
}

export default RealtimeMonacoDemo
