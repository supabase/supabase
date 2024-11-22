import { useParams } from 'common'
import { usePathname } from 'next/navigation'

export function useEditorType(): 'table-editor' | 'sql-editor' {
  const pathname = usePathname()
  const { ref } = useParams()

  return pathname?.includes(`/project/${ref}/editor`) ? 'table-editor' : 'sql-editor'
}
