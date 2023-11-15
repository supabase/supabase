import { useRouter } from 'next/router'
import { useState } from 'react'
import { Button, IconChevronRight, IconPlay } from 'ui'

import Table from 'components/to-be-cleaned/Table'
import SqlSnippetCode from './Logs.SqlSnippetCode'
import { timestampLocalFormatter } from './LogsFormatters'

interface SavedQueriesItemProps {
  item: any
}

const SavedQueriesItem = ({ item }: SavedQueriesItemProps) => {
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
            <span className="text-sm text-foreground">{item.name}</span>
          </div>
        </Table.td>
        <Table.td className="">
          <span className="text-foreground-light">{item.description}</span>
        </Table.td>
        <Table.td className="">
          <span className="text-foreground-light">{timestampLocalFormatter(item.inserted_at)}</span>
        </Table.td>
        <Table.td className="">
          <span className="text-foreground-light">{timestampLocalFormatter(item.updated_at)}</span>
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
        } expanded-row-content border-l border-r bg-alternative !pt-0 !pb-0 transition-all`}
        colSpan={5}
      >
        {expand && <SqlSnippetCode>{item.content.sql}</SqlSnippetCode>}
      </Table.td>
    </>
  )
}

export default SavedQueriesItem
