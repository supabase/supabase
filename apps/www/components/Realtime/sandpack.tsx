'use client'

import { SandpackProvider, SandpackLayout, SandpackPreview } from '@codesandbox/sandpack-react'
import './sandpack-styles.css' // Import custom Sandpack styles
import { useTheme } from 'next-themes'

type SandpackProps = {
  files: Record<string, string>
  dependencies?: Record<string, string>
}

export default function SandpackWrapper({ files, dependencies = {} }: SandpackProps) {
  const { resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme?.includes('dark')!

  // Ensure we have the required files for React template
  const completeFiles = {
    '/App.js': files['/App.js'] || files['App.js'] || '',
    '/styles.css': files['/styles.css'] || files['styles.css'] || '',
    ...files,
  }

  // Default dependencies
  const defaultDependencies = {
    '@supabase/supabase-js': 'latest',
    'lucide-react': 'latest',
  }

  return (
    <div className="flex-1 h-full min-h-80 md:min-h-96 w-full rounded-lg overflow-hidden border">
      <SandpackProvider
        template="react"
        theme={isDarkTheme ? 'dark' : 'light'}
        files={completeFiles}
        customSetup={{
          dependencies: {
            ...defaultDependencies,
            ...dependencies,
          },
        }}
        options={{
          visibleFiles: ['/App.js'],
          activeFile: '/App.js',
          externalResources: ['https://cdn.tailwindcss.com'],
        }}
      >
        <SandpackLayout className="!h-full !min-h-full sandpack-wrapper !bg-transparent !border-none !rounded-none !bg-surface-75 !flex !flex-col">
          <SandpackPreview
            showNavigator={false}
            showRefreshButton={false}
            showOpenInCodeSandbox={false}
            className="!h-full !flex-1 sandpack-preview !rounded-md"
          />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  )
}
