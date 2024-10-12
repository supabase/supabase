import { useEffect } from 'react'
import { useRouter } from 'next/router'

const SpamIndex = () => {
  const router = useRouter()

  // We don't want anyone landing here directly
  useEffect(() => {
    router.push('/')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null // Optionally, you can return a loading spinner or message
}

export default SpamIndex
