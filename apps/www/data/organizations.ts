import { components } from 'api-types'
import { useEffect, useState } from 'react'

import { API_URL } from '~/lib/constants'
import { get } from '~/lib/fetchWrapper'

export type Organization = components['schemas']['OrganizationResponse']

export function useOrganizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    get(`${API_URL}/organizations`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) {
          throw res
        }

        return res
      })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setOrganizations(data)
          setIsLoading(false)
        }
      })
      .catch(() => {
        // eat all errors
        setIsLoading(false)
      })

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [])

  return {
    organizations,
    isLoading,
  } as const
}
