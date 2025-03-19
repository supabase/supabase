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
    <div className="flex-1 h-full min-h-96 w-full bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700/50">
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
          visibleFiles: ['/App.js'],
          activeFile: '/App.js',
          externalResources: ['https://cdn.tailwindcss.com'],
        }}
      >
        <SandpackLayout className="!h-full !min-h-full sandpack-wrapper !border-none !rounded-none !bg-neutral-800 !flex !flex-col">
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
