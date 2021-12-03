import { FC } from 'react'
import { Typography } from '@supabase/ui'

const EmptyPanel: FC<any> = ({ icon, text }) => {
  return (
    <div className="flex items-center justify-center flex-row py-4 space-x-2">
      <div className="relative bg-bg-secondary-light w-12 h-12 rounded-full flex items-center justify-center text-gray-300">
        {icon}
      </div>
      <Typography.Text type="secondary">{text}</Typography.Text>
    </div>
  )
}

export default EmptyPanel
