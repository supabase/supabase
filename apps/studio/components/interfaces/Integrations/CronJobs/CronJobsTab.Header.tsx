import { RefreshCw, Search, X } from 'lucide-react'
import type { KeyboardEvent } from 'react'

import { Button } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

interface CronJobsTabHeaderProps {
  search: string
  isRefreshing: boolean
  onSearchChange: (value: string) => void
  onSearchSubmit: () => void
  onClearSearch: () => void
  onRefresh: () => void
  onCreateJob: () => void
}

export const CronJobsTabHeader = ({
  search,
  isRefreshing,
  onSearchChange,
  onSearchSubmit,
  onClearSearch,
  onRefresh,
  onCreateJob,
}: CronJobsTabHeaderProps) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.code === 'NumpadEnter') {
      onSearchSubmit()
    }
  }

  return (
    <div className="bg-surface-200 py-3 px-10 flex items-center justify-between flex-wrap gap-y-2">
      <Input
        size="tiny"
        className="w-52"
        placeholder="Search for a job"
        icon={<Search />}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={handleKeyDown}
        actions={[
          search && (
            <Button
              key="clear-search"
              size="tiny"
              type="text"
              icon={<X />}
              onClick={onClearSearch}
              className="p-0 h-5 w-5"
            />
          ),
        ]}
      />

      <div className="flex items-center gap-x-2">
        <Button type="default" icon={<RefreshCw />} loading={isRefreshing} onClick={onRefresh}>
          Refresh
        </Button>
        <Button onClick={onCreateJob}>Create job</Button>
      </div>
    </div>
  )
}
