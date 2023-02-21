import Link from 'next/link'
import { FC } from 'react'
import { Button, IconExternalLink, IconList } from 'ui'
import { LOGS_EXPLORER_DOCS_URL } from 'components/interfaces/Settings/Logs'

interface Props {
  subtitle?: string
}

const LogsExplorerHeader: FC<Props> = ({ subtitle }) => (
  <div className={['flex items-center gap-8 transition-all pb-6 justify-between'].join(' ')}>
    <div className="flex items-center gap-3">
      <div
        className="flex h-6 w-6 items-center justify-center rounded border
            border-brand-600 bg-brand-300 text-brand-900
          "
      >
        <IconList size={14} strokeWidth={3} />
      </div>

      <h1 className="text-2xl text-scale-1200">Logs Explorer</h1>
      {subtitle && <span className="text-2xl text-scale-1000">{subtitle}</span>}
    </div>
    <Link href={LOGS_EXPLORER_DOCS_URL}>
      <a>
        <Button type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
          Documentation
        </Button>
      </a>
    </Link>
  </div>
)
export default LogsExplorerHeader
