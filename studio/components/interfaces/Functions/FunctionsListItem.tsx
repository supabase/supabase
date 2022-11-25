import dayjs from 'dayjs'
import { FC } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'

import { useStore } from 'hooks'
import Table from 'components/to-be-cleaned/Table'

interface Props {
  function: any
}

const FunctionsListItem: FC<Props> = ({ function: item }) => {
  const { ui } = useStore()
  const is_functionConfirmed = item.email_confirmed_at || item.phone_confirmed_at

  const router = useRouter()
  const ref = ui?.selectedProject?.ref

  // get the .co or .net TLD from the restUrl
  const restUrl = ui.selectedProject?.restUrl
  const restUrlTld = new URL(restUrl as string).hostname.split('.').pop()

  return (
    <Table.tr
      key={item.id}
      onClick={() => {
        router.push(`/project/${ref}/functions/${item.id}`)
      }}
    >
      <Table.td className="">
        <div className="flex items-center gap-2">
          <span className="text-sm text-scale-1200">{item.name}</span>
        </div>
      </Table.td>
      <Table.td className="">
        <div className="text-xs text-scale-900 flex gap-2 items-center truncate">
          <span className="font-mono truncate hidden md:inline">{`https://${ref}.functions.supabase.${restUrlTld}/${item.slug}`}</span>
          <span className="font-mono truncate md:hidden">{`/${item.name}`}</span>
        </div>
      </Table.td>
      <Table.td className="hidden 2xl:table-cell">
        <span className="text-scale-1100">
          {dayjs(item.created_at).format('DD MMM, YYYY HH:mm')}
        </span>
      </Table.td>
      <Table.td className="hidden lg:table-cell">
        <span className="text-scale-1100">
          {dayjs(item.updated_at).format('DD MMM, YYYY HH:mm')}
        </span>
      </Table.td>
      <Table.td className="hidden 2xl:table-cell">
        <span className="text-scale-1100">v{item.version}</span>
      </Table.td>
      <Table.td className="2xl:table-cell text-right">
        <span className="text-scale-1100">{item.status}</span>
      </Table.td>
    </Table.tr>
  )
}

export default observer(FunctionsListItem)
