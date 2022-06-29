import { Button, IconPlay } from '@supabase/ui'
import Table from 'components/to-be-cleaned/Table'
import { useRouter } from 'next/router'
import { LogSqlSnippets } from 'types'
import SqlSnippetCode from './Logs.SqlSnippetCode'

interface Props {
  item: LogSqlSnippets.Content
}

const RecentQueriesItem: React.FC<Props> = ({ item }) => {
  const router = useRouter()
  const { ref } = router.query

  return (
      <Table.tr key={item.sql}>
        <Table.td
          className={`transition-all expanded-row-content bg-scale-100 border-l border-r !pt-0 !pb-0 !px-3`}
        >
          <SqlSnippetCode>{item.sql}</SqlSnippetCode>
        </Table.td>
        <Table.td className="text-right">
          <Button
            type="alternative"
            iconRight={<IconPlay size={10} />}
            onClick={() =>
              router.push(
                `/project/${ref}/logs-explorer?q=${encodeURIComponent(item.sql)}`
              )
            }
          >
            Run
          </Button>
        </Table.td>
      </Table.tr>
  )
}

export default RecentQueriesItem
