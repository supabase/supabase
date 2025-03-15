'use client'

import React from 'react'

type SandpackWrapperProps = {
  files: Record<string, string>
  dependencies?: Record<string, string>
}

export default function SandpackWrapper({ files, dependencies = {} }: SandpackWrapperProps) {
  return (
    <div className="bg-neutral-800 rounded border border-neutral-700/50 overflow-hidden h-full flex items-center justify-center">
      <div className="text-center text-neutral-400">
        <p className="mb-2">Interactive Preview</p>
        <p className="text-xs">
          (Replace with actual Sandpack component when Supabase variables are provided)
        </p>
      </div>
    </div>
  )
}
