'use client'

import { PlusCircle } from 'lucide-react'

export default function FilterHeader() {
  return (
    <div className="w-full bg-surface-100 h-[48px] border-b items-center flex px-3 gap-3 z-10">
      <div className="flex gap-2">
        <button className="rounded-full h-[26px] px-3 border border-dashed border-strong text-xs text-foreground-light flex items-center gap-2 pl-1">
          <PlusCircle size={18} className="text-foreground-muted" strokeWidth={1.3} />
          Sort
        </button>
        <button className="rounded-full h-[26px] px-3 border border-dashed border-strong text-xs text-foreground-light flex items-center gap-2 pl-1">
          <PlusCircle size={18} className="text-foreground-muted" strokeWidth={1.3} />
          Filter
        </button>
      </div>
    </div>
  )
}
