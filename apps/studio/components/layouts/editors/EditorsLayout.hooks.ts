import { useParams } from 'common'
import { usePathname } from 'next/navigation'

export type EditorType = 'table' | 'sql' | 'explorer' | undefined

export function useEditorType(): EditorType {
  const pathname = usePathname()
  const { ref } = useParams()

  return pathname?.includes(`/project/${ref}/editor`)
    ? 'table'
    : pathname?.includes(`/project/${ref}/sql`)
      ? 'sql'
      : pathname?.includes(`/project/${ref}/explorer`)
        ? 'explorer'
        : undefined
}
