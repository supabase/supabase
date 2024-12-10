import { useMemo } from 'react'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useFDWsQuery } from 'data/fdw/fdws-query'
import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { INTEGRATIONS } from '../Landing/Integrations.constants'
import WrapperRow from './WrapperRow'
import { wrapperMetaComparator } from './Wrappers.utils'

interface WrapperTableProps {
  isLatest?: boolean
}

export const WrapperTable = ({ isLatest = false }: WrapperTableProps) => {
  const { id, ref } = useParams()
  const { project } = useProjectContext()
  const integration = INTEGRATIONS.find((i) => i.id === id)

  const { data } = useFDWsQuery({
    projectRef: ref,
    connectionString: project?.connectionString,
  })

  const wrappers = useMemo(
    () =>
      integration && integration.type === 'wrapper' && data
        ? data.filter((wrapper) => wrapperMetaComparator(integration.meta, wrapper))
        : [],
    [data, integration]
  )

  if (!integration || integration.type !== 'wrapper') {
    return (
      <p className="text-foreground-light text-sm">
        The referenced ID doesn't correspond to a wrapper integration
      </p>
    )
  }

  return (
    <Card className="max-w-5xl">
      <CardContent className="p-0 pb-3">
        <Table className="">
          <TableCaption className="text-xs">
            {wrappers.length} {integration?.name}
            {wrappers.length > 1 ? 's' : ''} created
          </TableCaption>
          <TableHeader className="font-mono uppercase text-xs [&_th]:h-auto [&_th]:py-2">
            <TableRow className="rounded">
              <TableHead className="w-[220px]">Name</TableHead>
              <TableHead>Tables</TableHead>
              <TableHead>Encrypted key</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&_td]:py-0 [&_tr]:h-[50px] [&_tr]:border-dotted bg-surface-100">
            {(isLatest ? wrappers.slice(0, 3) : wrappers).map((x) => {
              return <WrapperRow key={x.id} wrapper={x} />
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
