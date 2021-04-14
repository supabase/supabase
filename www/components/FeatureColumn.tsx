import { Typography } from '@supabase/ui'

function FeatureColumn({ icon, title, text }: any) {
  return (
    <>
      <Typography.Text>
        <p>{icon}</p>
      </Typography.Text>
      <Typography.Title level={4}>{title}</Typography.Title>
      <Typography.Text>
        <p>{text}</p>
      </Typography.Text>
    </>
  )
}

export default FeatureColumn
