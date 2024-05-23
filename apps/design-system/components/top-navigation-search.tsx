'use client'

import { Search } from 'lucide-react'
import { Input } from 'ui-patterns/DataInputs/Input'

function TopNavigationSearch() {
  return (
    <Input
      size="small"
      className="transition w-64 rounded-full hover:bg-surface-200 hover:border-foreground-muted cursor-pointer"
      icon={<Search size={14} />}
      placeholder="Search Design System..."
    />
  )
}

export { TopNavigationSearch }
