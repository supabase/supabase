import { Tabs } from 'ui'
import { useRouter } from 'next/router'

const FunctionsNav = ({ item }: any) => {
  const router = useRouter()
  const activeRoute = router.pathname.split('/')[5]
  const { ref } = router.query

  return (
    <Tabs
      defaultActiveId="1"
      type="underlined"
      size="medium"
      activeId={!activeRoute ? 'metrics' : activeRoute}
      onChange={(e: string) => {
        if (item?.slug) {
          router.push(`/project/${ref}/functions/${item.slug}/${e === 'metrics' ? '' : e}`)
        }
      }}
    >
      <Tabs.Panel id="details" label="Details" />
      <Tabs.Panel id="metrics" label="Metrics" />
      <Tabs.Panel id="invocations" label="Invocations" />
      <Tabs.Panel id="logs" label="Logs" />
    </Tabs>
  )
}

export default FunctionsNav
