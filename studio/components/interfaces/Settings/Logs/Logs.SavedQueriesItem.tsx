import dayjs from 'dayjs'
import { FC, useState } from 'react'
import { Button, IconChevronRight, IconMaximize2, IconPlay } from 'ui'
import Table from 'components/to-be-cleaned/Table'
import { useRouter } from 'next/router'
import SqlSnippetCode from './Logs.SqlSnippetCode'

interface Props {
  item: any
}

const SavedQueriesItem: FC<Props> = ({ item }: Props) => {
  const [expand, setExpand] = useState<boolean>(false)

  const router = useRouter()
  const { ref } = router.query

  return (
    <>
      <Table.tr key={item.id} className="expandable-tr">
        <Table.td className="whitespace-nowrap">
          <div className="flex items-center gap-2">
            <button onClick={() => setExpand(!expand)}>
              <div className={'transition ' + (expand ? 'rotate-90' : 'rotate-0')}>
                <IconChevronRight strokeWidth={2} size={14} />
              </div>
            </button>
            <span className="text-sm text-scale-1200">{item.name}</span>
          </div>
        </Table.td>
        <Table.td className="">
          <span className="text-scale-1100">{item.description}</span>
        </Table.td>
        <Table.td className="">
          <span className="text-scale-1100">
            {dayjs(item.inserted_at).format('DD MMM, YYYY HH:mm')}
          </span>
        </Table.td>
        <Table.td className="">
          <span className="text-scale-1100">
            {dayjs(item.updated_at).format('DD MMM, YYYY HH:mm')}
          </span>
        </Table.td>
        <Table.td className=" text-right">
          <Button
            type="alternative"
            iconRight={<IconPlay size={10} />}
            onClick={() =>
              router.push(`/project/${ref}/logs/explorer?q=${encodeURIComponent(item.content.sql)}`)
            }
          >
            Run
          </Button>
        </Table.td>
      </Table.tr>
      <Table.td
        className={`${
          expand ? ' h-auto opacity-100' : 'h-0 opacity-0'
        } expanded-row-content border-l border-r bg-scale-100 !pt-0 !pb-0 transition-all`}
        colSpan={5}
      >
        {expand && <SqlSnippetCode>{item.content.sql}</SqlSnippetCode>}
      </Table.td>
    </>
  )
}

export default SavedQueriesItem
