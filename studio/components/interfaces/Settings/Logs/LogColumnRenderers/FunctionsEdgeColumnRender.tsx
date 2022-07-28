import { HeaderFormmater, ResponseCodeFormatter, TimestampLocalFormatter } from '../LogsFormatters'

export default [
  {
    key: 'timestamp',
    headerRenderer: () => (
      <div className="flex w-full justify-end h-full">
        <HeaderFormmater value={'timestamp'} />
      </div>
    ),
    name: 'timestamp',
    formatter: (data: any) => <TimestampLocalFormatter value={data.row.timestamp!} />,
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
