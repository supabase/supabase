import dayjs from 'dayjs'
import { FC } from 'react'
import { observer } from 'mobx-react-lite'
import {
  Badge,
  IconClipboard,
  IconExternalLink,
  IconGlobe,
  Icon_function,
  Typography,
} from '@supabase/ui'
import Table from 'components/to-be-cleaned/Table'

import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'
import router, { useRouter } from 'next/router'
import { useStore } from 'hooks'
// import _functionDropdown from './_functionDropdown'

interface Props {
  function: any
}

const FunctionsListItem: FC<Props> = ({ function: item }) => {
  const { ui } = useStore()

  console.log('_function', item)
  const is_functionConfirmed = item.email_confirmed_at || item.phone_confirmed_at

  const router = useRouter()
  const ref = ui?.selectedProject?.ref

  return (
    <Table.tr
      key={item.id}
      onClick={() => {
        router.push(`/project/${ref}/functions/${item.id}`)
      }}
    >
      <Table.td className="whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className="text-base text-scale-1200">{item.name}</span>
        </div>
      </Table.td>
      <Table.td className="whitespace-nowrap flex flex-col gap-0">
        <span className="text-sm text-scale-1100 flex items-center gap-1">
          <IconGlobe size={14} />
          HTTP Request
        </span>
        <span
          className="text-xs text-scale-900 flex gap-2 items-center
        font-mono"
        >
          {`https://${ref}.supabase.com/functions/${item.name}`}
          <IconClipboard size={12} />
        </span>
      </Table.td>
      <Table.td className="hidden 2xl:table-cell">
        <span className="text-scale-1100">{item.status}</span>
      </Table.td>
      <Table.td className="hidden 2xl:table-cell">
        <span className="text-scale-1100">
          {dayjs(item.created_at).format('DD MMM, YYYY HH:mm')}
        </span>
      </Table.td>
      <Table.td className="hidden 2xl:table-cell">
        <span className="text-scale-1100">
          {dayjs(item.updated_at).format('DD MMM, YYYY HH:mm')}
        </span>
      </Table.td>
      <Table.td className="hidden 2xl:table-cell">
        <span className="text-scale-1100">Version {item.version}</span>
      </Table.td>
    </Table.tr>
  )
}

export default observer(FunctionsListItem)
