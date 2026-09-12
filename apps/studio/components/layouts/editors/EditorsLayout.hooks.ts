import { useParams } from 'common'
import { usePathname } from 'next/navigation'

export type EditorType = 'table' | 'sql' | 'explorer' | undefined

export function useEditorType(): EditorType {
  const pathname = usePathname()
  const { ref } = useParams()

  if (pathname?.includes(`/project/${ref}/editor`)) return 'table'
  if (pathname?.includes(`/project/${ref}/sql`)) return 'sql'
  if (pathname?.includes(`/project/${ref}/explorer`)) return 'explorer'

  return undefined
}
