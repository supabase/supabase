import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import type { NextPageWithLayout } from 'types'

const DatabaseTriggersIndexPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()

  useEffect(() => {
    if (ref) {
      router.replace(`/project/${ref}/database/triggers/data`)
    }
  }, [ref, router])

  return null
}

DatabaseTriggersIndexPage.getLayout = (page) => page

export default DatabaseTriggersIndexPage
