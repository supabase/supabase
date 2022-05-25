import dayjs from 'dayjs'
import { HeaderFormmater, ResponseCodeFormatter } from '../LogsFormatters'

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
        <span className="text-xs">{dayjs(data?.row?.timestamp / 1000).format('DD MMM')}</span>
        <span className="text-xs">{dayjs(data?.row?.timestamp / 1000).format('HH:mm:ss')}</span>
        {/* {data?.row?.timestamp} */}
      </span>
    ),
    width: 128,
  },
  {
    key: 'status_code',
    headerRenderer: () => <HeaderFormmater value={'Status'} />,
    name: 'status_code',
    formatter: (data: any) => <ResponseCodeFormatter row={data} value={data.row.status_code} />,

    width: 0,
    resizable: true,
  },
  {
    key: 'method',
    headerRenderer: () => <HeaderFormmater value={'method'} />,
    width: 0,
    resizable: true,
  },
  {
    key: 'id',
    headerRenderer: () => <HeaderFormmater value={'id'} />,
    name: 'id',
    resizable: true,
  },
]
