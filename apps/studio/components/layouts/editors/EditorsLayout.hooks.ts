import { useLocation } from '@tanstack/react-router'
import { useParams } from 'common'

export type EditorType = 'table' | 'sql' | 'explorer' | undefined

export function useEditorType(): EditorType {
  const pathname = useLocation({ select: (location) => location.pathname })
  const { ref } = useParams()

  if (pathname.includes(`/project/${ref}/editor`)) return 'table'
  if (pathname.includes(`/project/${ref}/sql`)) return 'sql'
  if (pathname.includes(`/project/${ref}/explorer`)) return 'explorer'

  return undefined
}
