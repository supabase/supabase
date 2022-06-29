import { FC } from 'react'
import { IconAlertCircle, Loading, Typography } from '@supabase/ui'
import { SettingsLoadingStateProps } from './SettingsLoadingState.types'
import Panel from 'components/ui/Panel'

export const SettingsLoadingState: FC<SettingsLoadingStateProps> = ({ isError, errorMessage }) => {
  return (
    <Panel.Content className="py-8">
      {isError ? (
        <div className="flex items-center space-x-2">
          <Typography.Text type="secondary">
            <IconAlertCircle strokeWidth={2} />
          </Typography.Text>
          <Typography.Text type="secondary">{errorMessage}</Typography.Text>
        </div>
      ) : (
        <div className="py-4">
          {/* @ts-ignore */}
          <Loading active={true} />
        </div>
      )}
    </Panel.Content>
  )
}
