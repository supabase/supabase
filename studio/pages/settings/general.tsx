import SettingsLayout from 'components/layouts/SettingsLayout'
import { Typography } from '@supabase/ui'

export default function General() {
  return (
    <SettingsLayout title="General">
      <div className="p-4">
        <Typography.Title level={4}>General Settings</Typography.Title>
      </div>
    </SettingsLayout>
  )
}
