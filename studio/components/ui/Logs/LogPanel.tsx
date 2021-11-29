import React from 'react'
import { Button, Icon, Typography } from '@supabase/ui'
interface Props {
  title: string
  onRefresh?: () => void
  isLoading: boolean
  children?: JSX.Element
}

/**
 * Logs control panel header + wrapper
 */
export default ({ title, onRefresh, isLoading }: Props) => (

  <div className="flex items-center justify-between w-full">
    <Typography.Title level={5}>{title} </Typography.Title>
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