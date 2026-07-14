import { sortBy } from 'lodash'
import { RefreshCw, Search } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import AlertError from '@/components/ui/AlertError'
import { useSequenceResetMutation } from '@/data/database-sequences/sequence-reset-mutation'
import { DatabaseSequence, useSequencesQuery } from '@/data/database-sequences/sequences-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { onSearchInputEscape } from '@/lib/keyboard'

const SCHEMA = 'public'

export const Sequences = () => {
  const { data: project } = useSelectedProjectQuery()
  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''))
  const [resetSequence, setResetSequence] = useState<DatabaseSequence | null>(null)
  const [resetValue, setResetValue] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const {
    data: allSequences,
    error: sequencesError,
    isPending: isLoadingSequences,
    isSuccess: isSuccessSequences,
    isError: isErrorSequences,
  } = useSequencesQuery({
    schema: SCHEMA,
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { mutate: resetSequenceMutate, isPending: isResetting } = useSequenceResetMutation({
    onSuccess: async () => {
      setResetSequence(null)
      setResetValue('')
      toast.success('Successfully reset sequence value')
    },
  })

  const onConfirmReset = () => {
    if (!project || !resetSequence) return
    const parsed = parseInt(resetValue, 10)
    if (isNaN(parsed)) return toast.error('Please enter a valid integer')
    resetSequenceMutate({
      projectRef: project.ref,
      connectionString: project.connectionString,
      schema: SCHEMA,
      name: resetSequence.name,
      newValue: parsed,
    })
  }

  const sortedSequences = sortBy(allSequences ?? [], (s) => s.name.toLocaleLowerCase())
  const sequences =
    search.length > 0
      ? sortedSequences.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
      : sortedSequences

  return (
    <>
      <div className="pb-8">
        <div className="flex flex-col gap-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Input
              ref={searchInputRef}
              size="tiny"
              value={search}
              className="w-full lg:w-52"
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={onSearchInputEscape(search, setSearch)}
              placeholder="Search for a sequence"
              icon={<Search />}
            />
          </div>

          {isLoadingSequences && <GenericSkeletonLoader />}

          {isErrorSequences && (
            <AlertError
              error={sequencesError as any}
              subject="Failed to retrieve database sequences"
            />
          )}

          {isSuccessSequences && (
            <div className="w-full overflow-hidden">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Used By</TableHead>
                      <TableHead>Data Type</TableHead>
                      <TableHead>Last Value</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sequences.length === 0 && search.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <p className="text-sm text-foreground">No sequences found</p>
                          <p className="text-sm text-foreground-light">
                            There are no sequences in the public schema
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                    {sequences.length === 0 && search.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <p className="text-sm text-foreground">No results found</p>
                          <p className="text-sm text-foreground-light">
                            Your search for "{search}" did not return any results
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                    {sequences.map((sequence) => (
                      <TableRow key={sequence.name}>
                        <TableCell>
                          <p className="font-mono text-xs">{sequence.name}</p>
                        </TableCell>
                        <TableCell>
                          {sequence.owner_table ? (
                            <span className="font-mono text-xs text-foreground-light">
                              {sequence.owner_table}
                              {sequence.owner_column ? `.${sequence.owner_column}` : ''}
                            </span>
                          ) : (
                            <span className="text-foreground-lighter text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell>{sequence.data_type}</TableCell>
                        <TableCell>
                          {sequence.last_value !== null ? (
                            <span className="font-mono text-xs">{sequence.last_value}</span>
                          ) : (
                            <span className="text-foreground-lighter text-xs">Never used</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              aria-label="Reset sequence value"
                              type="text"
                              className="px-1"
                              icon={<RefreshCw />}
                              onClick={() => {
                                setResetSequence(sequence)
                                setResetValue(
                                  sequence.last_value !== null
                                    ? String(sequence.last_value + Number(sequence.increment_by))
                                    : String(sequence.start_value)
                                )
                              }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={!!resetSequence}
        onOpenChange={(open) => {
          if (!open) {
            setResetSequence(null)
            setResetValue('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Reset sequence <code className="text-code-inline">{resetSequence?.name}</code>
            </DialogTitle>
          </DialogHeader>
          <DialogSection>
            {resetSequence?.owner_table && (
              <p className="text-sm text-foreground-light mb-2">
                This sequence is used by{' '}
                <code className="text-code-inline">
                  {resetSequence.owner_table}
                  {resetSequence.owner_column ? `.${resetSequence.owner_column}` : ''}
                </code>
                .
              </p>
            )}
            <p className="text-sm text-foreground-light mb-3">
              Enter the next ID you want inserted rows to receive. For example, if your imported
              data has IDs up to <code className="text-code-inline">999</code>, enter{' '}
              <code className="text-code-inline">1000</code>.
            </p>
            <div className="flex flex-col gap-y-1">
              <label className="text-sm text-foreground-light">
                Next value (will be used on the next insert)
              </label>
              <Input
                type="number"
                value={resetValue}
                onChange={(e) => setResetValue(e.target.value)}
              />
            </div>
          </DialogSection>
          <DialogFooter>
            <Button
              type="default"
              onClick={() => {
                setResetSequence(null)
                setResetValue('')
              }}
            >
              Cancel
            </Button>
            <Button
              loading={isResetting}
              disabled={isResetting || resetValue === ''}
              onClick={onConfirmReset}
            >
              Reset value
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
