import { useLogDrainsQuery } from 'data/log-drains/log-drains-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import Link from 'next/link'
import { LOG_DRAIN_SOURCES } from './LogDrains.constants'
import { useParams } from 'common'
import CardButton from 'components/ui/CardButton'
import Panel from 'components/ui/Panel'

export function LogDrains() {
  const { ref } = useParams()
  const { data: logDrains, isLoading } = useLogDrainsQuery({ ref: undefined })

  if (isLoading) {
    return <div></div>
  }

  if (!isLoading && logDrains?.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {LOG_DRAIN_SOURCES.map((src) => (
          <CardButton
            key={src.value}
            title={src.name}
            description={src.description}
            icon={src.icon}
            linkHref={`/project/${ref}/settings/log-drains?new=1&src=${src.value}`}
          />
        ))}
      </div>
    )
  }

  return (
    <>
      <Panel className="p-3">
        {logDrains?.map((drain: any) => <pre>{JSON.stringify(drain, null, 2)}</pre>)}
      </Panel>
    </>
  )
}
