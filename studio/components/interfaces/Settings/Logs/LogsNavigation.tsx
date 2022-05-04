import { Tabs } from '@supabase/ui'
import { useFlag } from 'hooks'
import { useRouter } from 'next/router'

interface TabItem {
  label: string
  id: string
}
const LogsNavigation = () => {
  const router = useRouter()
  const activeRoute = router.pathname.split('/')[4]
  const { ref } = router.query

  const indexRoute = 'query'
  const logsSavedQueries = useFlag('logsSavedQueries')
  const logsRecentQueries = useFlag('logsRecentQueries')

  const tabs = [
    { id: 'query', label: 'Query' },
    logsSavedQueries ? { id: 'saved', label: 'Saved' } : null,
    logsRecentQueries ? { id: 'recent', label: 'Recent' } : null,
    { id: 'templates', label: 'Templates' },
  ].filter(Boolean) as TabItem[]

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
      {tabs.map((item) => (
        <Tabs.Panel key={item.id} id={item.id} label={item.label} />
      ))}
    </Tabs>
  )
}

export default LogsNavigation
