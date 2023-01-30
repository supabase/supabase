import { IconList } from 'ui'

interface Props {
  subtitle?: string
}

const LogsExplorerHeader: React.FC<Props> = ({ subtitle }) => (
  <div className={['flex flex-col gap-8 transition-all pb-6'].join(' ')}>
    <div className="flex items-center gap-3">
      <div
        className="flex h-6 w-6 items-center justify-center rounded border
            border-brand-600 bg-brand-300 text-brand-900
          "
      >
        <IconList size={14} strokeWidth={3} />
      </div>

      <h1 className="text-2xl text-scale-1200">Logs Explorer</h1>
      {subtitle && <span className="text-2xl text-scale-1100">{subtitle}</span>}
    </div>
  </div>
)
export default LogsExplorerHeader
