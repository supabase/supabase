import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

// Redirect to the new location under /branches
const EnvironmentVariablesRedirect = () => {
  const router = useRouter()
  const { ref } = useParams()

  useEffect(() => {
    if (ref) router.replace(`/project/${ref}/branches/environment-variables`)
  }, [ref, router])

  return null
}

export default EnvironmentVariablesRedirect
