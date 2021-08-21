import EditorLayout from '../../../components/layouts/EditorLayout'
import { SupabaseGrid } from '@supabase/grid'
import { useRouter } from 'next/router'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '../../../lib/constants'

export default function TableEditor() {
  const router = useRouter()
  const { tableName } = router.query

  return (
    <EditorLayout title={`Editor: ${tableName}`}>
      <div className="h-screen">
        <SupabaseGrid
          table={String(tableName)}
          clientProps={{
            supabaseUrl: SUPABASE_URL,
            supabaseKey: SUPABASE_SERVICE_KEY,
          }}
        />
      </div>
    </EditorLayout>
  )
}
