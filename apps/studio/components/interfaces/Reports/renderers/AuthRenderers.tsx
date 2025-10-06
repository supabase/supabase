// Update your AuthRenderers.tsx file:

import { Fragment, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useParams } from 'common'
import Table from 'components/to-be-cleaned/Table'
import BarChart from 'components/ui/Charts/BarChart'
import { useFillTimeseriesSorted } from 'hooks/analytics/useFillTimeseriesSorted'
import { ResponseError } from 'types'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  Collapsible,
  WarningIcon,
  Collapsible_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  CollapsibleContent_Shadcn_,
} from 'ui'
import AlertError from 'components/ui/AlertError'
import { TextFormatter } from 'components/interfaces/Settings/Logs/LogsFormatters'
import { ReportWidgetProps, ReportWidgetRendererProps } from '../ReportWidget'
import dayjs from 'dayjs'

export const SignUpChartRenderer = (
  props: ReportWidgetProps<{
    timestamp: string
    TotalSignUps: number
  }>
) => {
  const total = props.data.reduce((acc, datum) => {
    return acc + (datum.TotalSignUps || 0)
  }, 0)

  const { data, error, isError } = useFillTimeseriesSorted(
    props.data,
    'timestamp',
    'TotalSignUps',
    0,
    props.params?.iso_timestamp_start,
    props.params?.iso_timestamp_end
  )

  if (!!props.error) {
    const error = (
      typeof props.error === 'string' ? { message: props.error } : props.error
    ) as ResponseError
    return <AlertError subject="Failed to retrieve sign up data" error={error} />
  } else if (isError) {
    return (
      <Alert_Shadcn_ variant="warning">
        <WarningIcon />
        <AlertTitle_Shadcn_>Failed to retrieve sign up data</AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>{error.message}</AlertDescription_Shadcn_>
      </Alert_Shadcn_>
    )
  }

  return (
    <BarChart
      size="small"
      minimalHeader
      highlightedValue={total}
      className="w-full"
      data={data}
      yAxisKey="TotalSignUps"
      xAxisKey="timestamp"
      displayDateInUtc
    />
  )
}

export const SignInChartRenderer = (
  props: ReportWidgetProps<{
    timestamp: string
    SignInAttempts: number
  }>
) => {
  const total = props.data.reduce((acc, datum) => {
    return acc + (datum.SignInAttempts || 0)
  }, 0)

  const { data, error, isError } = useFillTimeseriesSorted(
    props.data,
    'timestamp',
    'SignInAttempts',
    0,
    props.params?.iso_timestamp_start,
    props.params?.iso_timestamp_end
  )

  if (!!props.error) {
    const error = (
      typeof props.error === 'string' ? { message: props.error } : props.error
    ) as ResponseError
    return <AlertError subject="Failed to retrieve sign in data" error={error} />
  } else if (isError) {
    return (
      <Alert_Shadcn_ variant="warning">
        <WarningIcon />
        <AlertTitle_Shadcn_>Failed to retrieve sign in data</AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>{error.message}</AlertDescription_Shadcn_>
      </Alert_Shadcn_>
    )
  }

  return (
    <BarChart
      size="small"
      minimalHeader
      highlightedValue={total}
      className="w-full"
      data={data}
      yAxisKey="SignInAttempts"
      xAxisKey="timestamp"
      displayDateInUtc
    />
  )
}

export const RecentSignUpsRenderer = (
  props: ReportWidgetRendererProps<{
    timestamp: string
    user_id: string
    email: string
    provider: string
  }>
) => {
  const { ref: projectRef } = useParams()
  const [showMore, setShowMore] = useState(false)

  const headerClasses = '!text-xs !py-2 p-0 font-bold !bg-surface-200 !border-x-0 !rounded-none'
  const cellClasses = '!text-xs !py-2 !border-x-0 !rounded-none align-middle'

  if (props.data.length === 0) return null

  return (
    <Collapsible>
      <Table
        className="rounded-t-none"
        head={
          <>
            <Table.th className={headerClasses}>User</Table.th>
            <Table.th className={headerClasses}>Provider</Table.th>
            <Table.th className={headerClasses + ' text-right'}>Time</Table.th>
          </>
        }
        body={
          <>
            {props.data.map((datum, index) => (
              <Fragment key={index + datum.user_id + datum.timestamp}>
                <Table.tr
                  className={[
                    'p-0 transition transform cursor-pointer hover:bg-surface-200',
                    showMore && index >= 3 ? 'w-full h-full opacity-100' : '',
                    !showMore && index >= 3 ? ' w-0 h-0 translate-y-10 opacity-0' : '',
                  ].join(' ')}
                >
                  {(!showMore && index < 3) || showMore ? (
                    <>
                      <Table.td className={[cellClasses].join(' ')}>
                        <div className="flex flex-col">
                          <TextFormatter
                            className="text-foreground-light font-medium"
                            value={datum.email || 'Unknown'}
                          />
                          <TextFormatter
                            className="text-foreground-lighter text-xs"
                            value={datum.user_id}
                          />
                        </div>
                      </Table.td>
                      <Table.td className={[cellClasses].join(' ')}>
                        <TextFormatter
                          className="w-16 h-4 text-center rounded bg-surface-300"
                          value={datum.provider || 'email'}
                        />
                      </Table.td>
                      <Table.td className={[cellClasses, 'text-right align-top'].join(' ')}>
                        {dayjs(datum.timestamp).format('MMM D, HH:mm')}
                      </Table.td>
                    </>
                  ) : null}
                </Table.tr>
              </Fragment>
            ))}
          </>
        }
      />
      <Collapsible.Trigger asChild>
        <div className="flex flex-row justify-end w-full gap-2 p-1">
          <Button
            type="text"
            onClick={() => setShowMore(!showMore)}
            className={[
              'transition',
              showMore ? 'text-foreground' : 'text-foreground-lighter',
              props.data.length <= 3 ? 'hidden' : '',
            ].join(' ')}
          >
            {!showMore ? 'Show more' : 'Show less'}
          </Button>
        </div>
      </Collapsible.Trigger>
    </Collapsible>
  )
}
