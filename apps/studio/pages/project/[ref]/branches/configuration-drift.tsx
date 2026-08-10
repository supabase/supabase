import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

const ConfigurationDriftRedirect = () => {
  const router = useRouter()
  const { ref } = useParams()

  useEffect(() => {
    if (ref) router.replace(`/project/${ref}/settings/configuration-drift`)
  }, [ref, router])

  return null
}

export default ConfigurationDriftRedirect
