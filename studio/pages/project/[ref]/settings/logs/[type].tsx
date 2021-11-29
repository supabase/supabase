import React, { useEffect, useState } from 'react'
import { SettingsLayout } from 'components/layouts'
import { useRouter } from 'next/router'
import LogPanel from 'components/ui/Logs/LogPanel'
import { LOG_TYPE_LABEL_MAPPING } from 'lib/constants'
import { observer } from 'mobx-react-lite'
import { withAuth } from 'hooks'
import { get } from "lib/common/fetch"
/**
 * Acts as a container component for the entire log display
 */
const LogPage = () => {
  const router = useRouter()
  const { ref, type } = router.query
  const title = LOG_TYPE_LABEL_MAPPING[type]
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)

  useEffect(() => {
    handleFetch()
  }, [])
  const handleFetch = async () => {
    setLoading(true)
    const result = await get(`${process.env.NEXT_PUBLIC_PLATFORM_API_URL}/projects/${ref}/logs?type=${type}`)
    console.log('handleFetch', data)
    setData(result)
    setLoading(false)
  }
  return (
    <SettingsLayout title={title}>
      <LogPanel isLoading={loading} onRefresh={handleFetch} />
    </SettingsLayout>
  )
}

export default withAuth(observer(LogPage))