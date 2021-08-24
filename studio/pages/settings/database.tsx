import SettingsLayout from 'components/layouts/SettingsLayout'
import { Typography } from '@supabase/ui'

export default function General() {
  return (
    <SettingsLayout title="Database">
      <div className="p-4">
        <Typography.Title level={4}>Database Settings</Typography.Title>
      </div>
    </SettingsLayout>
  )
}
