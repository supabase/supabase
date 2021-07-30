import EditorLayout from '../../../components/layouts/EditorLayout.tsx'
import { SupabaseGrid } from '@supabase/grid'
import { useRouter } from 'next/router'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../lib/constants.ts'

export default function TableEditor() {
  const router = useRouter()
  const { tableName } = router.query

  return (
    <EditorLayout title={`Editor: ${tableName}`}>
      <div className="h-screen">
        <SupabaseGrid
          table={tableName}
          clientProps={{
            supabaseUrl: SUPABASE_URL,
            supabaseKey: SUPABASE_ANON_KEY,
          }}
        />
      </div>
    </EditorLayout>
  )
}
