'use client'

import { useSupabaseClient } from '@/hooks/useSupabaseClient'
import { useUser } from '@clerk/nextjs'

export function InsertData() {
  const supabase = useSupabaseClient()

  const { user } = useUser()
  const organizationId = user?.organizationMemberships?.[0]?.organization?.id

  async function onInsertRow() {
    if (organizationId) {
      const { error } = await supabase
        .from('secured_table')
        .insert({ organization_id: organizationId })
      if (error) {
        console.error(error)
      }
    }
  }

  return <button onClick={onInsertRow}>Insert row to protected table</button>
}
