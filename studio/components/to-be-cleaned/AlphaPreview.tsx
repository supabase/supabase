import { Typography, IconAlertCircle } from '@supabase/ui'

const AlphaPreview = () => {
  return (
    <div className="block w-full bg-yellow-500 bg-opacity-5 p-3 border border-yellow-500 border-opacity-50 rounded">
      <div className="flex space-x-3">
        <div>
          <IconAlertCircle className="text-yellow-500" size="large" />
        </div>
        <div className="flex flex-col">
          <Typography.Text type="warning">Alpha preview</Typography.Text>
          <div>
            <Typography.Text type="warning" small>
              This is not suitable for production
            </Typography.Text>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AlphaPreview
