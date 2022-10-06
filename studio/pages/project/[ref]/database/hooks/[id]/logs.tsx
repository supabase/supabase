import useSWR from 'swr'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { uniqBy, map as lodashMap } from 'lodash'
import { FC, useState, useEffect } from 'react'
import { Button } from 'ui'
import { observer } from 'mobx-react-lite'

import { useStore } from 'hooks'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { DatabaseLayout } from 'components/layouts'
import { NextPageWithLayout } from 'types'

const FunctionsPage: NextPageWithLayout = () => {
  return (
    <div className="flex">
      <div className="my-4 w-full">
        <HookLogs />
      </div>
    </div>
  )
}

FunctionsPage.getLayout = (page) => <DatabaseLayout title="Hooks">{page}</DatabaseLayout>

export default observer(FunctionsPage)

const HookLogs: FC<any> = observer(() => {
  const router = useRouter()
  const { id: hookId } = router.query

  const { meta } = useStore()

  const [hooksData, setHooksData] = useState<any>([])
  const schemas = lodashMap(uniqBy(hooksData, 'schema'), 'schema')

  useEffect(() => {
    const fetchHooks = async () => {
      await meta.hooks.load()
      const hooksData = meta.hooks.list()
      setHooksData(hooksData)
    }
    fetchHooks()
  }, [])

  const logsUrl = `${API_URL}/database/${router.query.ref}/hook-logs?id=${hookId}`
  const { data: logsData, error: logsError }: any = useSWR(logsUrl, get)

  if (meta.hooks.hasError) {
    return (
      <p className="text-scale-1000">
        <p>Error connecting to API</p>
        <p>{`${meta.hooks.error}`}</p>
      </p>
    )
  }

  if (logsError) {
    return (
      <p className="text-scale-1000">
        <p>Error connecting to API</p>
        <p>{`${logsError.error}`}</p>
      </p>
    )
  }

  if (meta.hooks.isLoading || !logsData) {
    return <p className="px-6 py-4">Loading hook logs...</p>
  }

  return (
    <div className="space-y-8">
      {/* <CreateHook /> */}
      <div className="px-6">
        <h4 className="text-lg">{hooksData.name} logs</h4>
        <div className="space-x-3">
          <Button>All</Button>
          <Button>Errors</Button>
        </div>
      </div>

      <div className="border-t border-b bg-bg-alt-light">
        <div className="divide-y-2 ">
          {logsData?.map((log: any, i: number) => {
            return (
              <div key={i} className="flex flex-col space-y-1 py-4 px-6">
                <div className="flex items-center justify-between">
                  <div className="space-x-3">
                    <p className="font-mono text-scale-1000">[{log.method}]</p>
                    <p className="font-mono">{log.url}</p>
                  </div>
                  <p className="font-mono text-scale-1000">
                    {dayjs(log.created_at).format('DDMMYYY')}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})
