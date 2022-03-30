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
      <Tabs.Panel id="query" label="Query" />
      {logsSourcesPage && <Tabs.Panel id="sources" label="Sources" />}
      {/* <Tabs.Panel id="recent" label={'Recent'} /> */}
      {logsSavedQueries && <Tabs.Panel id="saved" label="Saved" />}
      <Tabs.Panel id="templates" label="Templates" />
    </Tabs>
  )
}

export default LogsNavigation
