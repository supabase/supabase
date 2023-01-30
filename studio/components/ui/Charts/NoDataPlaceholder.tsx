import { IconBarChart2 } from '@supabase/ui'

interface Props {
  title?: string
  message?: string
  className?: string
}
const NoDataPlaceholder: React.FC<Props> = ({
  title = 'No data to show',
  message,
  className = '',
}) => (
  <div
    className={
      'border-scale-600 flex h-full w-full flex-col items-center justify-center space-y-2 border border-dashed text-center ' +
      className
    }
  >
    <IconBarChart2 className="text-scale-800" />
    <div>
      <p className="text-scale-1100 text-xs">{title}</p>
      {message && <p className="text-scale-900 text-xs">{message}</p>}
    </div>
  </div>
)
export default NoDataPlaceholder
