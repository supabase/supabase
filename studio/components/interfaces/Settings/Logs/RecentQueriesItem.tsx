import { Button, IconPlay } from '@supabase/ui'
import Table from 'components/to-be-cleaned/Table'
import { useRouter } from 'next/router'
import { LogSqlSnippets } from 'types'

interface Props {
  item: LogSqlSnippets.Content
}

const RecentQueriesItem: React.FC<Props> = ({ item }) => {
  const router = useRouter()
  const { ref } = router.query

  return (
      <Table.tr key={item.sql}>
        <Table.td>
          <div
            className={ 'whitespace-nowrap bg-scale-100 border-l border-r !pt-0 !pb-0 text-scale-1200 transition-all expanded-row-content '}
          >
            <pre className="text-sm break-words py-4 px-3 ">{item.sql}</pre>
          </div>
        </Table.td>
        <Table.td className=" text-right">
          <Button
            type="alternative"
            iconRight={<IconPlay size={10} />}
            onClick={() =>
              router.push(
                `/project/${ref}/logs-explorer?sql=${encodeURIComponent(item.sql)}`
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
