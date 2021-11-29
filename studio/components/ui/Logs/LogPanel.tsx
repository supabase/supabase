import React from 'react'
import { Button, Input } from '@supabase/ui'
import Panel from 'components/to-be-cleaned/Panel'

interface Props {
  onRefresh?: () => void
  onSearch?: (query: string) => void
  isLoading: boolean
  children?: JSX.Element
  heading?: JSX.Element
}

/**
 * Logs control panel header + wrapper
 */
const LogPanel = ({ onRefresh, isLoading, heading, children, onSearch }: Props) => (
  <Panel
    title={
      <div
        className="flex items-center justify-between w-full"
      >
        <Button type="secondary">Recent - All</Button>
        <div className="flex flex-row gap-x-4">

          <Input className="max-w-32" placeholder="Search" onChange={e => onSearch ? onSearch(e.target.value) : null} />
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