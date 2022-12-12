import Table from 'components/to-be-cleaned/Table'
import { ReportWidgetProps } from '../ReportWidget'

export const renderUserAgents = (
  props: ReportWidgetProps<{
    user_agent: string
    request_source: string
    count: number
  }>
) => {
  return (
    <Table
      containerClassName="max-h-72 w-full overflow-y-auto"
      className="relative rounded border border-scale-600"
      head={
        <>
          <Table.th className="sticky top-0 z-10">User Agents</Table.th>
          <Table.th className="sticky top-0 z-10">Request Source</Table.th>
          <Table.th className="sticky top-0 z-10">Count</Table.th>
        </>
      }
      body={
        <>
          {props.data.map((row, index) => {
            return (
              <Table.tr key={index}>
                <Table.td className="max-w-sm lg:max-w-lg" style={{ padding: '0.3rem' }}>
                  {row.user_agent ? (
                    row.user_agent
                  ) : (
                    <span className="text-scale-1000">No user agent</span>
                  )}
                </Table.td>
                <Table.td>{row.request_source}</Table.td>
                <Table.td style={{ padding: '0.5rem' }} className="align-top text-xs">
                  {row.count}
                </Table.td>
              </Table.tr>
            )
          })}
        </>
      }
    />
  )
}

export const renderBotScores = (
  props: ReportWidgetProps<{
    ip: string
    country: string
    user_agent: string
    path: string
    bot_score: number
    bot_verified: boolean
    count: number
  }>
) => {
  return (
    <Table
      containerClassName="max-h-72 w-full overflow-y-auto"
      className="relative rounded border border-scale-600"
      head={
        <>
          <Table.th className="sticky top-0 z-10">IP (Country)</Table.th>
          <Table.th className="sticky top-0 z-10">Request Path</Table.th>
          <Table.th className="sticky top-0 z-10">User Agent</Table.th>
          <Table.th className="sticky top-0 z-10">Bot Score</Table.th>
          <Table.th className="sticky top-0 z-10">Is Verified Bot</Table.th>
          <Table.th className="sticky top-0 z-10">Count</Table.th>
        </>
      }
      body={
        <>
          {props.data.map((row, index) => {
            return (
              <Table.tr key={index}>
                <Table.td className="max-w-sm lg:max-w-lg" style={{ padding: '0.3rem' }}>
                  {row.ip} ({row.country})
                </Table.td>
                <Table.td>{row.path}</Table.td>
                <Table.td className="max-w-xs truncate">{row.user_agent}</Table.td>
                <Table.td>{row.bot_score}</Table.td>
                <Table.td>{row.bot_verified ? 'Yes' : 'No'}</Table.td>
                <Table.td style={{ padding: '0.5rem' }} className="align-top text-xs">
                  {row.count}
                </Table.td>
              </Table.tr>
            )
          })}
        </>
      }
    />
  )
}
