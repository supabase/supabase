import { Typography } from '@supabase/ui'

function FeatureColumn({ icon, title, text }: any) {
  return (
    <>
      <p>
        <p>{icon}</p>
      </p>
      <Typography.Title level={4}>{title}</Typography.Title>
      <p>
        <p>{text}</p>
      </p>
    </>
  )
}

export default FeatureColumn
