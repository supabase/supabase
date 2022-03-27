import { Tabs } from '@supabase/ui'
import { useRouter } from 'next/router'

const LogsNavigation = () => {
  const router = useRouter()
  const activeRoute = router.pathname.split('/')[4]
  const { ref } = router.query

  const indexRoute = 'query'

  return (
    <Tabs
      defaultActiveId="1"
      type="underlined"
      size="medium"
      activeId={!activeRoute ? indexRoute : activeRoute}
      onChange={(e: string) =>
        router.push(`/project/${ref}/logs-explorer/${e === indexRoute ? '' : e}`)
      }
    >
      <Tabs.Panel id="query" label="Query" />
      {/* <Tabs.Panel id="recent" label={'Recent'} /> */}
      <Tabs.Panel id="saved" label="Saved" />
      <Tabs.Panel id="templates" label="Templates" />
    </Tabs>
  )
}

export default LogsNavigation
