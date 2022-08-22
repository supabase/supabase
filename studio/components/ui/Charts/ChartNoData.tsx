import { IconBarChart2 } from '@supabase/ui'

const ChartNoData = ({
  title = 'No data to show',
  message = 'May take 24 hours for data to show',
}) => (
  <div
    className="
      border-scale-600 flex
      h-full w-full flex-col
      items-center justify-center space-y-2 border
      border-dashed text-center
    "
  >
    <IconBarChart2 className="text-scale-800" />
    <div>
      <p className="text-scale-1100 text-xs">{title}</p>
      <p className="text-scale-900 text-xs">{message}</p>
    </div>
  </div>
)
export default ChartNoData
