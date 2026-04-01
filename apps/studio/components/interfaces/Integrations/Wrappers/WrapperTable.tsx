import { useParams } from 'common'
import { useFDWsQuery } from 'data/fdw/fdws-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'
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

interface WrapperTableProps {
  isLatest?: boolean
}

export const WrapperTable = ({ isLatest = false }: WrapperTableProps) => {
  const { id, ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const integration = INTEGRATIONS.find((i) => i.id === id)

  const [isClosingEditWrapper, setIsClosingEditWrapper] = useState(false)

  const { data, isSuccess } = useFDWsQuery({
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
  const selectedWrapperToEdit = wrappers.find((w) => w.id.toString() === selectedWrapperIdToEdit)

  useEffect(() => {
    if (isSuccess && !!selectedWrapperIdToEdit && !selectedWrapperToEdit) {
      toast('Wrapper not found')
      setSelectedWrapperToEdit(null)
    }
  }, [isSuccess, selectedWrapperIdToEdit, selectedWrapperToEdit, setSelectedWrapperToEdit])

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
            {(isLatest ? wrappers.slice(0, 3) : wrappers).map((x) => {
              return <WrapperRow key={x.id} wrapper={x} />
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
        <SheetContent size="lg" tabIndex={undefined}>
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
