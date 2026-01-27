import { useRouter } from 'next/router'
import { useEffect } from 'react'

const OptOutIndex = () => {
  const router = useRouter()

  // We don't want anyone landing here directly
  useEffect(() => {
    router.push('/')
  }, [router])

  return null
}

export default OptOutIndex
