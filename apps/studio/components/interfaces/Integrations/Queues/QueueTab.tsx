import { Lock, Paintbrush, PlusCircle, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import DeleteQueue from 'components/interfaces/Integrations/Queues/SingleQueue/DeleteQueue'
import PurgeQueue from 'components/interfaces/Integrations/Queues/SingleQueue/PurgeQueue'
import { QUEUE_MESSAGE_TYPE } from 'components/interfaces/Integrations/Queues/SingleQueue/Queue.utils'
import { QueueMessagesDataGrid } from 'components/interfaces/Integrations/Queues/SingleQueue/QueueDataGrid'
import { QueueFilters } from 'components/interfaces/Integrations/Queues/SingleQueue/QueueFilters'
import { QueueSettings } from 'components/interfaces/Integrations/Queues/SingleQueue/QueueSettings'
import { SendMessageModal } from 'components/interfaces/Integrations/Queues/SingleQueue/SendMessageModal'
import { Markdown } from 'components/interfaces/Markdown'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import { useQueueMessagesInfiniteQuery } from 'data/database-queues/database-queue-messages-infinite-query'
import { useQueuesExposePostgrestStatusQuery } from 'data/database-queues/database-queues-expose-postgrest-status-query'
import { useTableUpdateMutation } from 'data/tables/table-update-mutation'
import { useTablesQuery } from 'data/tables/tables-query'
import {
  Button,
  cn,
  LoadingLine,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Separator,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'

export const QueueTab = () => {
  const { childId: queueName, ref } = useParams()
  const { project } = useProjectContext()

  const [openRlsPopover, setOpenRlsPopover] = useState(false)
  const [rlsConfirmModalOpen, setRlsConfirmModalOpen] = useState(false)
  const [sendMessageModalShown, setSendMessageModalShown] = useState(false)
  const [purgeQueueModalShown, setPurgeQueueModalShown] = useState(false)
  const [deleteQueueModalShown, setDeleteQueueModalShown] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<QUEUE_MESSAGE_TYPE[]>([])

  const { data: tables, isLoading: isLoadingTables } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: 'pgmq',
  })
  const queueTable = tables?.find((x) => x.name === `q_${queueName}`)
  const isRlsEnabled = queueTable?.rls_enabled ?? false

  const { data: policies } = useDatabasePoliciesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: 'pgmq',
  })
  const queuePolicies = (policies ?? []).filter((policy) => policy.table === `q_${queueName}`)

  const { data: isExposed } = useQueuesExposePostgrestStatusQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { data, error, isLoading, fetchNextPage, isFetching } = useQueueMessagesInfiniteQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      queueName: queueName!,
      // when no types are selected, include all types of messages
      status: selectedTypes.length === 0 ? ['archived', 'available', 'scheduled'] : selectedTypes,
    },
    { staleTime: 30 }
  )
  const messages = useMemo(() => data?.pages.flatMap((p) => p), [data?.pages])

  const { mutate: updateTable, isLoading: isUpdatingTable } = useTableUpdateMutation({
    onSettled: () => {
      toast.success(`Successfully enabled RLS for ${queueName}`)
      setRlsConfirmModalOpen(false)
    },
  })

  const onToggleRLS = async () => {
    if (!project) return console.error('Project is required')
    if (!queueTable) return toast.error('Unable to toggle RLS: Queue table not found')
    const payload = {
      id: queueTable.id,
      rls_enabled: true,
    }
    updateTable({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      id: payload.id,
      schema: 'pgmq',
      payload: payload,
    })
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-end gap-x-4 py-4 px-6 mb-0">
        <div className="flex gap-x-2">
          <QueueSettings />

          <ButtonTooltip
            type="text"
            className="px-1.5"
            onClick={() => setPurgeQueueModalShown(true)}
            icon={<Paintbrush />}
            title="Purge messages"
            tooltip={{ content: { side: 'bottom', text: 'Purge messages' } }}
          />

          <ButtonTooltip
            type="text"
            className="px-1.5"
            onClick={() => setDeleteQueueModalShown(true)}
            icon={<Trash2 />}
            title="Delete queue"
            tooltip={{ content: { side: 'bottom', text: 'Delete queue' } }}
          />

          <Separator orientation="vertical" className="h-[26px]" />

          {isLoadingTables ? (
            <ShimmeringLoader className="w-[123px]" />
          ) : isRlsEnabled ? (
            <>
              {queuePolicies.length === 0 ? (
                <ButtonTooltip
                  asChild
                  type="default"
                  className="group"
                  icon={<PlusCircle strokeWidth={1.5} className="text-foreground-muted" />}
                  tooltip={{
                    content: {
                      side: 'bottom',
                      className: 'w-[280px]',
                      text: 'RLS is enabled for this queue, but no policies are set. Queue will not be accessible.',
                    },
                  }}
                >
                  <Link
                    passHref
                    href={`/project/${ref}/auth/policies?search=${queueTable?.id}&schema=pgmq`}
                  >
                    Add RLS policy
                  </Link>
                </ButtonTooltip>
              ) : (
                <Button
                  asChild
                  type="default"
                  className="group"
                  icon={
                    <div
                      className={cn(
                        'flex items-center justify-center rounded-full bg-border-stronger h-[16px]',
                        queuePolicies.length > 9 ? ' px-1' : 'w-[16px]'
                      )}
                    >
                      <span className="text-[11px] text-foreground font-mono text-center">
                        {queuePolicies.length}
                      </span>
                    </div>
                  }
                >
                  <Link
                    passHref
                    href={`/project/${ref}/auth/policies?search=${queueTable?.id}&schema=pgmq`}
                  >
                    Auth {queuePolicies.length > 1 ? 'policies' : 'policy'}
                  </Link>
                </Button>
              )}
            </>
          ) : (
            <Popover_Shadcn_
              modal={false}
              open={openRlsPopover}
              onOpenChange={() => setOpenRlsPopover(!openRlsPopover)}
            >
              <PopoverTrigger_Shadcn_ asChild>
                <Button type={isExposed ? 'warning' : 'default'} icon={<Lock strokeWidth={1.5} />}>
                  RLS disabled
                </Button>
              </PopoverTrigger_Shadcn_>
              <PopoverContent_Shadcn_ className="w-80 text-sm" align="end">
                <h3 className="text-xs flex items-center gap-x-2">
                  <Lock size={14} /> Row Level Security (RLS)
                </h3>
                <div className="grid gap-2 mt-2 text-foreground-light text-xs">
                  {isExposed ? (
                    <>
                      <p>
                        You can restrict and control who can manage this queue using Row Level
                        Security.
                      </p>
                      <p>With RLS enabled, anonymous users will not have access to this queue.</p>
                      <Button
                        type="default"
                        className="w-min"
                        onClick={() => setRlsConfirmModalOpen(!rlsConfirmModalOpen)}
                      >
                        Enable RLS for this queue
                      </Button>
                    </>
                  ) : (
                    <>
                      <Markdown
                        className="[&>p]:!leading-normal text-xs [&>p]:!m-0 flex flex-col gap-y-2"
                        content={`
RLS for queues is only relevant if exposure through PostgREST has been enabled, in which you can restrict and control who can manage this queue using Row Level Security.

You may opt to manage your queues via any Supabase client libraries or PostgREST endpoints by enabling this in the [queues settings](/project/${project?.ref}/integrations/queues/settings).`}
                      />
                      <Button
                        type="default"
                        className="w-min"
                        onClick={() => setRlsConfirmModalOpen(!rlsConfirmModalOpen)}
                      >
                        Enable RLS for this queue
                      </Button>
                    </>
                  )}
                </div>
              </PopoverContent_Shadcn_>
            </Popover_Shadcn_>
          )}

          <Button type="primary" onClick={() => setSendMessageModalShown(true)}>
            Add message
          </Button>

          {/* <DocsButton href={docsUrl} />} */}
        </div>
      </div>

      <QueueFilters selectedTypes={selectedTypes} setSelectedTypes={setSelectedTypes} />
      <LoadingLine loading={isFetching} />
      <QueueMessagesDataGrid
        error={error}
        messages={messages || []}
        isLoading={isLoading}
        showMessageModal={() => setSendMessageModalShown(true)}
        fetchNextPage={fetchNextPage}
      />
      <SendMessageModal
        visible={sendMessageModalShown}
        onClose={() => setSendMessageModalShown(false)}
      />
      <DeleteQueue
        queueName={queueName!}
        visible={deleteQueueModalShown}
        onClose={() => setDeleteQueueModalShown(false)}
      />
      <PurgeQueue
        queueName={queueName!}
        visible={purgeQueueModalShown}
        onClose={() => setPurgeQueueModalShown(false)}
      />

      <ConfirmationModal
        visible={rlsConfirmModalOpen}
        title="Confirm to enable Row Level Security"
        confirmLabel="Enable RLS"
        confirmLabelLoading="Enabling RLS"
        loading={isUpdatingTable}
        onCancel={() => setRlsConfirmModalOpen(false)}
        onConfirm={() => onToggleRLS()}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you want to enable Row Level Security for the queue "{queueName}"?
        </p>
      </ConfirmationModal>
    </div>
  )
}
