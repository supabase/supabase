import React from 'react'
import { Button, Icon, Typography } from '@supabase/ui'
interface Props {
  title: string
  onRefresh?: () => void
  isLoading: boolean
  heading?: JSX.Element
}

/**
 * Logs control panel header + wrapper
 */
const LogPanel = ({ onRefresh, isLoading, heading }: Props) => (
  <div className="flex items-center justify-between w-full">
    <div>
      {heading}
    </div>
    <Button
      type="outline"
      loading={isLoading}
      disabled={isLoading ? true : false}
      onClick={onRefresh}
    >
      Refresh
    </Button>
  </div>
)
export default LogPanel