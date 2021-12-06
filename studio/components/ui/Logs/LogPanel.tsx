import React from 'react'
import { Button, Input, Dropdown, Typography, IconChevronDown } from '@supabase/ui'
import Panel from 'components/to-be-cleaned/Panel'

interface Props {
  showReset: boolean
  onReset: () => void
  onRefresh?: () => void
  onSearch?: (query: string) => void
  onCustomClick?: () => void
  isLoading: boolean
  children?: JSX.Element
  searchValue?: string
  templates?: {
    label: string
    onClick: () => void
  }[]
}

/**
 * Logs control panel header + wrapper
 */
const LogPanel = ({
  onRefresh,
  isLoading,
  searchValue,
  children,
  onSearch,
  onCustomClick,
  showReset,
  onReset,
  templates = [] }: Props) => (
  <Panel
    title={
      <div className="flex items-center justify-between w-full" >
        <div className="flex flex-row gap-x-4">
          <Dropdown
            side="bottom"
            align="start"
            overlay={templates.map(p =>
              <Dropdown.Item key={p.label} onClick={p.onClick}>
                <Typography.Text>{p.label}</Typography.Text>
              </Dropdown.Item>
            )}
          >
            <Button
              iconRight={<IconChevronDown />}
              type="secondary" onClick={() => console.log("templates clicked")}>Templates</Button>
          </Dropdown>

          <Button type="secondary" onClick={onCustomClick}>Custom query</Button>
          {showReset && (
            <Button type="dashed" onClick={onReset}>Reset filters</Button>)}
        </div>
        <div className="flex flex-row gap-x-4">
          <Input className="max-w-32" placeholder="Filter" onChange={e => {
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