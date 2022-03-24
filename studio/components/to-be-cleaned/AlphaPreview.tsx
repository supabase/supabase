import { Typography, IconAlertCircle, Alert } from '@supabase/ui'

const AlphaPreview = () => {
  return (
    <Alert title="Alpha preview" withIcon variant="warning">
      This is not suitable for production
    </Alert>
  )
}

export default AlphaPreview
