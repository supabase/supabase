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
// import _functionDropdown from './_functionDropdown'

interface Props {
  _function: any
}

const FunctionsListItem: FC<Props> = ({ _function }) => {
  const is_functionConfirmed = _function.email_confirmed_at || _function.phone_confirmed_at

  const router = useRouter()
  const { ref } = router.query

  return (
    <Table.tr
      key={_function.id}
      onClick={() => {
        router.push(`/project/${ref}/functions/hello-world`)
      }}
    >
      <Table.td className="whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className="text-base text-scale-1200">{_function.name}</span>
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
          https://adlnssnsfsfsfdf.supabase.com/functions/{_function.name}
          <IconClipboard size={12} />
        </span>
      </Table.td>
      <Table.td className="hidden 2xl:table-cell">
        <span className="text-scale-1100">
          {dayjs(_function.created_at).format('DD MMM, YYYY HH:mm')}
        </span>
      </Table.td>
      <Table.td className="hidden 2xl:table-cell">
        <span className="text-scale-1100">{_function.runtime}</span>
      </Table.td>
      <Table.td className="hidden 2xl:table-cell">
        <span className="text-scale-1100">{_function.memory} MB</span>
      </Table.td>
    </Table.tr>
  )
}

export default observer(FunctionsListItem)
