import React from 'react'
import { Button, Icon, Typography } from '@supabase/ui'
import Panel from 'components/to-be-cleaned/Panel'

interface Props {
  onRefresh?: () => void
  isLoading: boolean
  children?: JSX.Element
  heading?: JSX.Element
}

/**
 * Logs control panel header + wrapper
 */
const LogPanel = ({ onRefresh, isLoading, heading, children }: Props) => (
  <Panel
    title={
      <div
        className="flex items-center justify-between w-full"
      >
        <Button type="secondary">Recent - All</Button>
        <div>
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
    footer={children}
  >
  </Panel>
)
export default LogPanel