import useSWR from 'swr'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { uniqBy, map as lodashMap } from 'lodash'
import { FC, useState, useEffect } from 'react'
import { Button, Typography } from '@supabase/ui'
import { observer } from 'mobx-react-lite'

import { useStore, withAuth } from 'hooks'
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
      <Typography.Text type="danger">
        <p>Error connecting to API</p>
        <p>{`${meta.hooks.error}`}</p>
      </Typography.Text>
    )
  }

  if (logsError) {
    return (
      <Typography.Text type="danger">
        <p>Error connecting to API</p>
        <p>{`${logsError.error}`}</p>
      </Typography.Text>
    )
  }

  if (meta.hooks.isLoading || !logsData) {
    return <Typography.Text className="px-6 py-4">Loading hook logs...</Typography.Text>
  }

  return (
    <div className="space-y-8">
      {/* <CreateHook /> */}
      <div className="px-6">
        <Typography.Title level={4}>{hooksData.name} logs</Typography.Title>
        <div className="space-x-3">
          <Button>All</Button>
          <Button>Errors</Button>
        </div>
      </div>

      <div className="bg-bg-alt-light border-t border-b">
        <div className="divide-y-2 ">
          {logsData?.map((log: any) => {
            return (
              <div className="flex flex-col space-y-1 py-4 px-6">
                <div className="flex items-center justify-between">
                  <div className="space-x-3">
                    <Typography.Text className="font-mono" type="secondary">
                      [{log.method}]
                    </Typography.Text>
                    <Typography.Text className="font-mono" type="default">
                      {log.url}
                    </Typography.Text>
                  </div>
                  <Typography.Text className="font-mono" type="secondary">
                    {dayjs(log.created_at).format('DDMMYYY')}
                  </Typography.Text>
                </div>
                {/* <Typography.Text className="font-mono">created at: {log.created_at}</Typography.Text>
                <Typography.Text className="font-mono">headers: {log.headers}</Typography.Text>
                <Typography.Text className="font-mono">args: {log.args}</Typography.Text>
                <Typography.Text className="font-mono">method: {log.method}</Typography.Text>
                <Typography.Text className="font-mono">status: {log.status}</Typography.Text> */}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})
