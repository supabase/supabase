import EditorLayout from '../../../components/layouts/EditorLayout'
import { SupabaseGrid, SupabaseGridRef } from '@supabase/grid'
import { useRouter } from 'next/router'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../lib/constants'
import { useRef } from 'react'

export default function TableEditor() {
  const router = useRouter()
  const { tableName } = router.query
  const gridRef = useRef<SupabaseGridRef>(null)

  return (
    <EditorLayout title={`Editor: ${tableName}`}>
      <div className="h-screen">
        <SupabaseGrid
          ref={gridRef}
          table={String(tableName)}
          editable
          gridProps={{
            height: '100%',
          }}
          clientProps={{
            supabaseUrl: SUPABASE_URL,
            supabaseKey: SUPABASE_ANON_KEY,
          }}
          onError={(error) => {
            console.log('ERROR: ', error)
          }}
          onAddColumn={() => {
            console.log('add new column')
          }}
          onEditColumn={(columnName) => {
            console.log('edit column: ', columnName)
          }}
          onDeleteColumn={(columnName) => {
            console.log('delete column: ', columnName)
          }}
          onAddRow={() => {
            console.log('add new row')
            return {}
          }}
          onEditRow={(rowIdx) => {
            console.log('edit row: ', rowIdx)
          }}
        />
      </div>
    </EditorLayout>
  )
}
