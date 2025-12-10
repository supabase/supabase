import { useMemo, useRef } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useFDWsQuery } from 'data/fdw/fdws-query'
import { handleErrorOnDelete, useQueryStateWithSelect } from 'hooks/misc/useQueryStateWithSelect'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  Card,
  cn,
  Table,
  TableBody,
  TableCell,
  TableFooter,
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
  const { data: project } = useSelectedProjectQuery()
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

  // Track the ID being deleted to exclude it from error checking
  const deletingWrapperIdRef = useRef<string | null>(null)

  const { setValue: setSelectedWrapperToEdit, value: selectedWrapperToEdit } =
    useQueryStateWithSelect({
      urlKey: 'edit',
      select: (wrapperId: string) =>
        wrapperId ? wrappers.find((w) => w.id.toString() === wrapperId) : undefined,
      enabled: !!wrappers.length,
      onError: () => toast.error(`Wrapper not found`),
    })

  const { setValue: setSelectedWrapperToDelete, value: selectedWrapperToDelete } =
    useQueryStateWithSelect({
      urlKey: 'delete',
      select: (wrapperId: string) =>
        wrapperId ? wrappers.find((w) => w.id.toString() === wrapperId) : undefined,
      enabled: !!wrappers.length,
      onError: (_error, selectedId) =>
        handleErrorOnDelete(deletingWrapperIdRef, selectedId, `Wrapper not found`),
    })

  if (!integration || integration.type !== 'wrapper') {
    return (
      <p className="text-foreground-light text-sm">
        The referenced ID doesn't correspond to a wrapper integration
      </p>
    )
  }

  return (
    <Card className="max-w-5xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[220px]">Name</TableHead>
            <TableHead>Tables</TableHead>
            <TableHead>Encrypted key</TableHead>
            <TableHead className="w-24">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(isLatest ? wrappers.slice(0, 3) : wrappers).map((x) => {
            return (
              <WrapperRow
                key={x.id}
                wrapper={x}
                wrappers={wrappers}
                selectedWrapperToEdit={selectedWrapperToEdit}
                selectedWrapperToDelete={selectedWrapperToDelete}
                setSelectedWrapperToEdit={setSelectedWrapperToEdit}
                setSelectedWrapperToDelete={setSelectedWrapperToDelete}
                deletingWrapperIdRef={deletingWrapperIdRef}
              />
            )
          })}
        </TableBody>
        <TableFooter
          className={cn(
            'text-xs font-normal text-center text-foreground-muted',
            // Prevent the footer from being highlighted on hover
            '[&>tr>td]:hover:bg-inherit',
            // Conditionally remove the border-top if there are no wrappers
            wrappers.length === 0 ? 'border-t-0' : ''
          )}
        >
          <TableRow>
            <TableCell colSpan={4}>
              {wrappers.length} {integration?.name}
              {wrappers.length > 1 ? 's' : ''} created
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </Card>
  )
}
