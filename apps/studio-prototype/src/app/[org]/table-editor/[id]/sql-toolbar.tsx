'use client'

import { PlusCircle } from 'lucide-react'
import { Button } from 'ui'

export default function SqlToolbar() {
  return (
    <div className="w-full bg-surface-100 h-[48px] min-h-[48px] border-b items-center flex px-3 gap-3 justify-between">
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
      <div className="-space-x-px">
        <Button type="default" className="rounded-r-none">
          Service role key
        </Button>
        <Button className="rounded-l-none">Run</Button>
      </div>
    </div>
  )
}
