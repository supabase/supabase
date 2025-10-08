'use client'

import { useSupabaseClient } from '@/hooks/useSupabaseClient'
import { useEffect, useState } from 'react'

export function ReadData() {
  const supabase = useSupabaseClient()
  const [data, setData] = useState<Array<unknown>>([])

  useEffect(() => {
    supabase
      .from('secured_table')
      .select('*')
      .then(({ data, error }) => {
        if (error) {
          console.error(error)
        } else {
          setData(data)
        }
      })
  }, [supabase])

  return <pre>{JSON.stringify(data, null, 2)}</pre>
}
