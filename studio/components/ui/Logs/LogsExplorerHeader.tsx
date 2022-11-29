import LogsNavigation from 'components/interfaces/Settings/Logs/LogsNavigation'
import { IconList } from 'ui'

const LogsExplorerHeader = () => {
  return (
    <div className={['flex flex-col gap-4 transition-all'].join(' ')}>
      <div className="flex items-center gap-3">
        <div
          className="flex h-6 w-6 items-center justify-center rounded border
            border-brand-600 bg-brand-300 text-brand-900
          "
        >
          <IconList size={14} strokeWidth={3} />
        </div>
        <h1 className="text-2xl text-scale-1200">Logs Explorer</h1>
        {/* {subtitle && <Badge color="scale">{subtitle}</Badge>} */}
      </div>
      <LogsNavigation />
    </div>
  )
}

export default LogsExplorerHeader
