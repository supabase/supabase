import { useParams } from 'common'
import { usePathname } from 'next/navigation'

export function useEditorType(): 'table' | 'sql' {
  const pathname = usePathname()
  const { ref } = useParams()

  return pathname?.includes(`/project/${ref}/editor`) ? 'table' : 'sql'
}
