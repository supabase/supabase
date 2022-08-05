import { HeaderFormmater, SeverityFormatter, TimestampLocalFormatter } from '../LogsFormatters'

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
      <TimestampLocalFormatter className="!text-scale-1100" value={data.row.timestamp!} />
    ),
    width: 128,
    resizable: true,
  },
  {
    key: 'level',
    headerRenderer: () => <HeaderFormmater value={'Level'} />,
    name: 'level',
    formatter: (data: any) => {
      if (data.row.event_type === 'uncaughtException') {
        return <SeverityFormatter value={data.row.event_type} uppercase={false} />
      }
      return <SeverityFormatter value={data.row.level} />
    },
    width: 24,
    resizable: true,
  },
  {
    key: 'event_message',
    headerRenderer: () => <HeaderFormmater value={'Event message'} />,
    resizable: true,
  },
]
