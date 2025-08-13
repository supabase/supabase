import { useParams } from 'common'
import { usePathname } from 'next/navigation'

export function useEditorType(): 'table' | 'sql' | undefined {
  const pathname = usePathname()
  const { slug, ref } = useParams()

  return pathname?.includes(`/org/${slug}/project/${ref}/editor`)
    ? 'table'
    : pathname?.includes(`/org/${slug}/project/${ref}/sql`)
      ? 'sql'
      : undefined
}
