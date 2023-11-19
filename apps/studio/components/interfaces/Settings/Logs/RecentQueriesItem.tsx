import { Button, IconPlay } from 'ui'
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
        className={`expanded-row-content border-l border-r bg-alternative !px-3 !pt-0 !pb-0 transition-all`}
      >
        <SqlSnippetCode>{item.sql}</SqlSnippetCode>
      </Table.td>
      <Table.td className="text-right">
        <Button
          type="alternative"
          iconRight={<IconPlay size={10} />}
          onClick={() =>
            router.push(`/project/${ref}/logs/explorer?q=${encodeURIComponent(item.sql)}`)
          }
        >
          Run
        </Button>
      </Table.td>
    </Table.tr>
  )
}

export default RecentQueriesItem
