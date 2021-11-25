import { IconGlobe, IconTool, Typography } from '@supabase/ui'

const { Text } = Typography

const EmptyPanel = ({ icon, text }) => {
  return (
    <div className="flex items-center justify-center flex-row py-4 space-x-2">
      <div className="relative bg-bg-secondary-light w-12 h-12 rounded-full flex items-center justify-center text-gray-300">
        {icon}
      </div>
      <Text type="secondary">{text}</Text>
    </div>
  )
}

export default EmptyPanel
