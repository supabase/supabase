'use client'

import { CheckCircle } from 'lucide-react'

export default function CopySuccessMessages() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-[400px]">
      <div className="flex flex-col gap-4 w-full">
        <span className="text-xs text-foreground-muted">Bad Example</span>
        <div className="flex flex-row items-center gap-2 border border-brand-500 rounded-md px-4 py-2 bg-brand-300 text-brand-600 shadow-md">
          <CheckCircle size={16} strokeWidth={1.5} className="shrink-0" />
          <p className="text-sm">Success!</p>
        </div>
      </div>
      <div className="flex flex-col gap-4 w-full">
        <span className="text-xs text-foreground-muted">Good Example</span>
        <div className="flex flex-row items-center gap-2 border border-brand-500 rounded-md px-4 py-2 bg-brand-300 text-brand-600 shadow-md">
          <CheckCircle size={16} strokeWidth={1.5} className="shrink-0" />
          <p className="text-sm">Table created successfully</p>
        </div>
      </div>
    </div>
  )
}
