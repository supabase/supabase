import { Tabs } from '@supabase/ui'
import { useFlag } from 'hooks'
import { useRouter } from 'next/router'

const LogsNavigation = () => {
  const router = useRouter()
  const activeRoute = router.pathname.split('/')[4]
  const { ref } = router.query

  const indexRoute = 'query'
  const logsSourcesPage = useFlag('logsSourcesPage')
  const logsSavedQueries = useFlag('logsSavedQueries')

  const tabs = [
    { id: 'query', label: 'Query' },
    logsSourcesPage ? { id: 'sources', label: 'Sources' } : null,
    logsSavedQueries ? { id: 'saved', label: 'Saved' } : null,
    { id: 'templates', label: 'Templates' },
  ].filter(Boolean)

  return (
    <Tabs
      defaultActiveId="1"
      type="underlined"
      size="medium"
      activeId={!activeRoute ? indexRoute : activeRoute}
      onClick={(e: string) => {
        router.push(`/project/${ref}/logs-explorer/${e === indexRoute ? '' : e}`)
      }}
    >
      {/* TODO: type properly */}
      {(tabs as any[]).map(({ id, label }) => (
        <Tabs.Panel id={id} label={label} />
      ))}
    </Tabs>
  )
}

export default LogsNavigation
