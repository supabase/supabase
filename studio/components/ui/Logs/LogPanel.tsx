import React from 'react'
import { Button, Input } from '@supabase/ui'
import Panel from 'components/to-be-cleaned/Panel'

interface Props {
  onRefresh?: () => void
  onSearch?: (query: string) => void
  onCustomClick?: () => void
  isLoading: boolean
  children?: JSX.Element
  searchValue?: string
  presets?: {
    label: string
    onClick: () => void
  }[]
}

/**
 * Logs control panel header + wrapper
 */
const LogPanel = ({ onRefresh, isLoading, searchValue, children, onSearch, onCustomClick, presets = [] }: Props) => (
  <Panel
    title={
      <div className="flex items-center justify-between w-full" >
        <div className="flex flex-row gap-x-4">
          {presets.map(p =>
            <Button key={p.label} type="secondary" onClick={p.onClick}>{p.label}</Button>
          )}
          <Button type="primary" onClick={onCustomClick}>Custom Query</Button>
        </div>
        <div className="flex flex-row gap-x-4">
          <Input className="max-w-32" placeholder="Search" onChange={e => {
            if (onSearch) onSearch(e.target.value)
          }} value={searchValue} />
          <Button
            type="outline"
            loading={isLoading}
            disabled={isLoading ? true : false}
            onClick={onRefresh}
          >
            Refresh
          </Button>

        </div>
      </div>
    }
  >
    {children}
  </Panel>
)
export default LogPanel