import dayjs from 'dayjs'
import { FC } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, IconClipboard, IconGlobe, IconPlay } from '@supabase/ui'
import Table from 'components/to-be-cleaned/Table'

import { useRouter } from 'next/router'
import { useStore } from 'hooks'
// import _functionDropdown from './_functionDropdown'

interface Props {
  item: any
}

const SavedQueriesItem: FC<Props> = ({ item }: Props) => {
  console.log('item in component', item)
  return (
    <Table.tr key={item.id}>
      <Table.td className="whitespace-nowrap">
        <div className="flex items-center gap-2">
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
        <Button type="alternative" iconRight={<IconPlay size={10} />}>
          Run
        </Button>
      </Table.td>
    </Table.tr>
  )
}

export default observer(SavedQueriesItem)
