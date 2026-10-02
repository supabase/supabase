import { useParams } from 'common'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Card,
  cn,
  Sheet,
  SheetContent,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'

import { INTEGRATIONS } from '../Landing/Integrations.constants'
import { DeleteWrapperModal } from './DeleteWrapperModal'
import { EditWrapperSheet } from './EditWrapperSheet'
import { WrapperRow } from './WrapperRow'
import { wrapperMetaComparator } from './Wrappers.utils'
import { useFDWsQuery } from '@/data/fdw/fdws-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

interface WrapperTableProps {
  isLatest?: boolean
}

export const WrapperTable = ({ isLatest = false }: WrapperTableProps) => {
  const { id, ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const integration = INTEGRATIONS.find((i) => i.id === id)

  const [isClosingEditWrapper, setIsClosingEditWrapper] = useState(false)

  const { data, isError, isSuccess } = useFDWsQuery({
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

  const [selectedWrapperIdToEdit, setSelectedWrapperToEdit] = useQueryState('edit', parseAsString)
  const isSharedWrapper = (wrapper: (typeof wrappers)[number]) =>
    data?.some((other) => other.id !== wrapper.id && other.name === wrapper.name) ?? false
  const selectedWrapper = wrappers.find((w) => w.id.toString() === selectedWrapperIdToEdit)
  const isSelectedWrapperShared = selectedWrapper !== undefined && isSharedWrapper(selectedWrapper)
  const selectedWrapperToEdit = isSelectedWrapperShared ? undefined : selectedWrapper
  const openedWrapperId = useRef<string | null>(null)

  useEffect(() => {
    if (!selectedWrapperIdToEdit) {
      openedWrapperId.current = null
    } else if (selectedWrapperToEdit) {
      openedWrapperId.current = selectedWrapperIdToEdit
    } else if (isSuccess || isError) {
      if (openedWrapperId.current !== selectedWrapperIdToEdit) {
        toast(
          isSelectedWrapperShared
            ? 'Shared wrappers cannot be edited in the dashboard. Use the SQL Editor to edit this connection.'
            : 'Wrapper not found'
        )
      }
      setSelectedWrapperToEdit(null)
    }
  }, [
    isError,
    isSelectedWrapperShared,
    isSuccess,
    selectedWrapperIdToEdit,
    selectedWrapperToEdit,
    setSelectedWrapperToEdit,
  ])

  if (!integration || integration.type !== 'wrapper') {
    return (
      <p className="text-foreground-light text-sm">
        The referenced ID doesn't correspond to a wrapper integration
      </p>
    )
  }

  return (
    <>
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
            {(isLatest ? wrappers.slice(0, 3) : wrappers).map((x) => (
              <WrapperRow key={x.id} wrapper={x} isShared={isSharedWrapper(x)} />
            ))}
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
            <TableRow className="border-b-0">
              <TableCell colSpan={4}>
                {wrappers.length} {integration?.name}
                {wrappers.length === 0 || wrappers.length > 1 ? 's' : ''} created
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Card>

      <Sheet
        open={!!selectedWrapperToEdit}
        onOpenChange={(open) => {
          if (!open) setIsClosingEditWrapper(true)
        }}
      >
        <SheetContent size="lg">
          {selectedWrapperToEdit && (
            <EditWrapperSheet
              wrapper={selectedWrapperToEdit}
              wrapperMeta={integration.meta}
              onClose={() => {
                setSelectedWrapperToEdit(null)
                setIsClosingEditWrapper(false)
              }}
              isClosing={isClosingEditWrapper}
              setIsClosing={setIsClosingEditWrapper}
            />
          )}
        </SheetContent>
      </Sheet>

      <DeleteWrapperModal />
    </>
  )
}
