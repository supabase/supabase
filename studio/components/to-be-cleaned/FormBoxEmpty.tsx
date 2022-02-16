import { FC } from 'react'
import { Typography } from '@supabase/ui'

const EmptyPanel: FC<any> = ({ icon, text }) => {
  return (
    <div className="flex items-center justify-center flex-row py-4 space-x-2">
      <div className="relative bg-scale-300 text-scale-900 w-6 h-6 rounded-full flex items-center justify-center">
        {icon}
      </div>
      <Typography.Text type="secondary">{text}</Typography.Text>
    </div>
  )
}

export default EmptyPanel
