import dayjs from 'dayjs'
import { HeaderFormmater, SeverityFormatter } from '../LogsFormatters'

export default [
  {
    key: 'timestamp',
    headerRenderer: () => (
      <div className="flex w-full justify-end h-full">
        <HeaderFormmater value={'timestamp'} />
      </div>
    ),
    name: 'timestamp',
    formatter: (data: any) => (
      <span className="flex w-full h-full items-center gap-1">
        <span className="text-xs !text-scale-1100">
          {dayjs(data?.row?.timestamp / 1000).format('DD MMM')}
        </span>
        <span className="text-xs !text-scale-1100">
          {dayjs(data?.row?.timestamp / 1000).format('HH:mm:ss')}
        </span>
        {/* {data?.row?.timestamp} */}
      </span>
    ),
    width: 128,
    resizable: true,
  },
  {
    key: 'level',
    headerRenderer: () => <HeaderFormmater value={'Level'} />,
    name: 'level',
    formatter: (data: any) => <SeverityFormatter value={data.row.level} />,
    width: 24,
    resizable: true,
  },
  {
    key: 'event_message',
    headerRenderer: () => <HeaderFormmater value={'Event message'} />,
    resizable: true,
  },
]
