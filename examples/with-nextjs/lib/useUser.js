import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import cookies from 'js-cookie'

const useUser = () => {
  const [user, setUser] = useState()
  const router = useRouter()

  const logout = async () => {
    cookies.remove('auth')
    router.push('/auth')
  }

  useEffect(() => {
    const cookie = cookies.get('auth')
    if (!cookie) {
      router.push('/')
      return
    }
    setUser(JSON.parse(cookie))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { user, logout }
}

export { useUser }
