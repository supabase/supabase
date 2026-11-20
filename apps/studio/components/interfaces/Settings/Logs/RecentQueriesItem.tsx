import { PlayIcon } from 'lucide-react'
import { useRouter } from 'next/router'
import { Button, TableCell, TableRow } from 'ui'

import SqlSnippetCode from './Logs.SqlSnippetCode'
import type { LogSqlSnippets } from '@/types'

interface Props {
  item: LogSqlSnippets.Content
}

export const RecentQueriesItem = ({ item }: Props) => {
  const router = useRouter()
  const { ref } = router.query

  return (
    <TableRow key={item.unchecked_sql}>
      <TableCell className="border-l border-r bg-alternative px-3 py-0 transition-all">
        <SqlSnippetCode>{item.unchecked_sql}</SqlSnippetCode>
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="primary"
          iconRight={<PlayIcon size={10} />}
          onClick={() =>
            router.push(`/project/${ref}/logs/explorer?q=${encodeURIComponent(item.unchecked_sql)}`)
          }
        >
          Run
        </Button>
      </TableCell>
    </TableRow>
  )
}
