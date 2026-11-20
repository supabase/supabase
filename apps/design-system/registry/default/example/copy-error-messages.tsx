'use client'

import { CircleAlert } from 'lucide-react'

export default function CopyErrorMessages() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-[400px]">
      <div className="flex flex-col gap-4 w-full">
        <span className="text-xs text-foreground-muted">Bad Example</span>
        <div className="flex flex-row items-center gap-2 border border-destructive-500 rounded-md px-4 py-2 bg-destructive-200 text-destructive shadow-md">
          <CircleAlert size={16} strokeWidth={1.5} className="shrink-0" />
          <p className="text-sm">Something went wrong. Please try again.</p>
        </div>
      </div>
      <div className="flex flex-col gap-4 w-full">
        <span className="text-xs text-foreground-muted">Good Example</span>
        <div className="flex flex-row items-center gap-2 border border-destructive-500 rounded-md px-4 py-2 bg-destructive-200 text-destructive shadow-md">
          <CircleAlert size={16} strokeWidth={1.5} className="shrink-0" />
          <p className="text-sm">Invalid API key. Check your project settings.</p>
        </div>
      </div>
    </div>
  )
}
