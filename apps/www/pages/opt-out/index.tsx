import { useEffect } from 'react'
import { useRouter } from 'next/router'

const OptOutIndex = () => {
  const router = useRouter()

  // We don't want anyone landing here directly
  useEffect(() => {
    router.push('/')
  }, [router])

  return null
}

export default OptOutIndex
