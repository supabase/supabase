'use client'

import { SandpackProvider, SandpackLayout, SandpackPreview } from '@codesandbox/sandpack-react'
import './sandpack-styles.css' // Import custom Sandpack styles

type SandpackProps = {
  files: Record<string, string>
  dependencies?: Record<string, string>
}

export default function SandpackWrapper({ files, dependencies = {} }: SandpackProps) {
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
    <div className="h-full w-full">
      <SandpackProvider
        template="react"
        files={completeFiles}
        customSetup={{
          dependencies: {
            ...defaultDependencies,
            ...dependencies,
          },
        }}
        options={{
          experimental_enableServiceWorker: true,
          visibleFiles: ['/App.js'],
          initMode: 'user-visible',
          activeFile: '/App.js',
          externalResources: ['https://cdn.tailwindcss.com'],
        }}
      >
        <SandpackLayout className="!h-full !min-h-full !border-none !bg-surface-50 !rounded-none !flex !flex-col">
          <SandpackPreview
            showNavigator={false}
            showRefreshButton={false}
            showOpenInCodeSandbox={false}
            className="!h-full !flex-1 !border-none"
          />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  )
}
