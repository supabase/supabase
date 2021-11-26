import { useState, useEffect } from 'react'
import { Button, Typography } from '@supabase/ui'

import { API_URL } from 'lib/constants'
import { get } from 'lib/common/fetch'
import Panel from './Panel'

export default function LogPanel({ title, projectRef, app }) {
  const [logs, setLogs] = useState([])
  const [lines, setLines] = useState(10)
  const [isLoading, setIsLoading] = useState(false)

  const refreshLogs = async () => {
    setIsLoading(true)
    try {
      const data = await get(`${API_URL}/projects/${projectRef}/logs?app=${app}`)
      if (data.error) throw data.error
      const cleansed = data.logs
        .split('\n')
        .filter((x) => x.trim() != '')
        .reverse()
      setLogs(cleansed)
    } catch (error) {
      console.error('Refresh logs error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshLogs()
  }, [])

  return (
    <Panel
      title={
        <div className="flex items-center justify-between w-full">
          <Typography.Title level={5} className="flex-1 block">
            {title}
          </Typography.Title>
          <div className="flex-1 text-right">
            <Button
              type="outline"
              className="hover:border-gray-400"
              disabled={isLoading}
              loading={isLoading}
              onClick={() => refreshLogs()}
            >
              Refresh
            </Button>
          </div>
        </div>
      }
    >
      <div className="max-w-full w-full rounded overflow-hidden">
        <div className="relative max-w-full overflow-x-auto">
          {logs.map((x, i) => (
            <div
              key={x}
              className={`block whitespace-nowrap px-4 py-3 font-mono border-t dark:border-dark`}
            >
              <Typography.Text>{x}</Typography.Text>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  )
}
