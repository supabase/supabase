import { SupabaseClient } from '@supabase/supabase-js'
import { Typography } from '@supabase/ui'

export default function BecomeAPartner({ supabase }: { supabase: SupabaseClient }) {
  return (
    <div id="become-a-partner">
      <Typography.Title level={2}>Become a Partner</Typography.Title>
    </div>
  )
}
