import React from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { withAuth } from 'hooks'
import { LogsExplorerLayout } from 'components/layouts/'
import { LogsTableName } from 'components/interfaces/Settings/Logs'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'

export const LogPage: NextPage = () => {
  const router = useRouter()
  const { ref, source } = router.query

  useEffect(() => {
    if (filters.search_query !== s) {
      setFilters((prev) => ({ ...prev, search_query: s as string }))
    }
    if (te !== params.timestamp_end) {
      setTo(te as string)
    }
    if (ts !== params.timestamp_start) {
      setFrom(ts as string)
    }
  }, [s, te, ts])

  useEffect(() => {
    router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        q: undefined,
        s: filters.search_query || '',
        ts: params.timestamp_start,
        te: params.timestamp_end,
      },
    })
  }, [params.timestamp_end, params.timestamp_start, filters.search_query])
  const onSelectTemplate = (template: LogTemplate) => {
    setFilters((prev) => ({ ...prev, search_query: template.searchString }))
  }

  useEffect(() => {
    // runs when any of the filters change
    handleRefresh()
  }, [whereFilters])

  const handleRefresh = () => {
    refresh()
    router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        te: undefined,
        ts: undefined,
      },
    })
  }

  const handleSearch: LogSearchCallback = ({ query, to, from, fromMicro, toMicro }) => {
    let toValue
    if (to || toMicro) {
      toValue = toMicro ? toMicro : dayjs(to).valueOf() * 1000

      setTo(String(toValue))
    }
    if (from || fromMicro) {
      fromValue = fromMicro ? fromMicro : dayjs(from).valueOf() * 1000
      setFrom(String(fromValue))
    }
    setFilters((prev) => ({ ...prev, search_query: query || '' }))

    router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        s: query || '',
        ts: fromValue,
        te: toValue,
      },
    })
  }

  useEffect(() => {
    // console.log('useEffectFilters', whereFilters)

    router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        ...whereFilters,
      },
    })
  }

  return (
    <LogsExplorerLayout subtitle={<span className="font-mono">{source}</span>}>
      <LogsPreviewer
        projectRef={ref as string}
        condensedLayout={true}
        tableName={source as LogsTableName}
      />
    </LogsExplorerLayout>
  )
}

export default withAuth(observer(LogPage))
