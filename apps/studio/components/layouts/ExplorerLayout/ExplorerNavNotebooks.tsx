import { useState } from 'react'

import { ExplorerNavResourceWrapper } from './ExplorerLayout.constants'

export const ExplorerNavNotebooks = ({ onBack }: { onBack: () => void }) => {
  const [search, setSearch] = useState('')

  // [Joshen] Eventually will have data fetching for notebooks via RQ

  return (
    <ExplorerNavResourceWrapper
      type="notebook"
      search={search}
      setSearch={setSearch}
      onBack={onBack}
    >
      <div className="flex flex-1 flex-col gap-px overflow-y-auto px-3 pb-3">
        <p className="px-2 py-2 text-xs text-foreground-lighter">No notebooks created yet</p>
      </div>
    </ExplorerNavResourceWrapper>
  )
}
