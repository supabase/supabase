import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircleIcon, Loader2Icon, PlusIcon, XIcon } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Button, cn, Form, FormControl, FormField, FormItem, FormMessage, Input } from 'ui'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'
import * as z from 'zod'

import { type LogsView } from '../UnifiedLogs.views'
import { CHIP_CLASS, LogsViewChip } from './LogsViewChip'
import { isDuplicateViewName, MIN_FILTERS_TO_SAVE, VIEW_NAME_MAX_LENGTH } from './LogsViews.utils'
import { RenameViewDialog } from './RenameViewDialog'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

interface LogsViewsBarProps {
  views: LogsView[]
  isLoading: boolean
  isError: boolean
  activeViewId: string | null
  activeFilterCount?: number
  canCreate?: boolean
  canUpdate?: boolean
  canDelete?: boolean
  isPending?: boolean
  isActiveViewModified?: boolean
  isReviewOpen?: boolean
  activeChipRef?: React.Ref<HTMLDivElement>
  onReviewChanges?: () => void
  onApply: (view: LogsView) => void
  onClearActiveView: () => void
  onRename: (id: string, name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onSaveCurrentView?: () => void
  isSaving?: boolean
  saveNameSeed?: string
  onSubmitSave?: (name: string) => Promise<void>
  onCancelSave?: () => void
  onRetry?: () => void
  id?: string
}

const SAVE_DEFAULT_VALUES = { name: '' }

const FADE_TRANSITION = { duration: 0.15 }

const getStatusMessage = ({
  isSaving,
  isLoading,
  isError,
  isEmpty,
  count,
}: {
  isSaving: boolean
  isLoading: boolean
  isError: boolean
  isEmpty: boolean
  count: number
}) => {
  if (isSaving) return 'Enter a name to save the current filters as a view'
  if (isLoading) return 'Loading saved views'
  if (isError) return 'Failed to load saved views'
  if (isEmpty) return 'No saved views'
  return `${count} saved ${count === 1 ? 'view' : 'views'}`
}

export const LogsViewsBar = ({
  views,
  isLoading,
  isError,
  activeViewId,
  activeFilterCount = 0,
  canCreate = true,
  canUpdate = true,
  canDelete = true,
  isPending = false,
  isActiveViewModified = false,
  isReviewOpen = false,
  activeChipRef,
  onReviewChanges,
  onApply,
  onClearActiveView,
  onRename,
  onDelete,
  onSaveCurrentView,
  isSaving = false,
  saveNameSeed,
  onSubmitSave,
  onCancelSave,
  onRetry,
  id,
}: LogsViewsBarProps) => {
  const [deleteTarget, setDeleteTarget] = useState<LogsView | null>(null)
  const [renameTarget, setRenameTarget] = useState<LogsView | null>(null)
  const reduceMotion = useReducedMotion()
  const nameInputRef = useRef<HTMLInputElement | null>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  const isEmpty = !isLoading && !isError && views.length === 0
  const hasFiltersToSave = activeFilterCount >= MIN_FILTERS_TO_SAVE
  const canSaveCurrentFilters = canCreate && hasFiltersToSave
  const saveDisabledReason = !canCreate
    ? "You don't have permission to save views"
    : 'Add a filter to save a view'

  const existingNames = useMemo(() => views.map((view) => view.name), [views])
  const schema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(1, 'Enter a name for this view')
          .max(VIEW_NAME_MAX_LENGTH, `Keep the name to ${VIEW_NAME_MAX_LENGTH} characters or less.`)
          .refine(
            (name) => !isDuplicateViewName(name, existingNames),
            "That name's already taken. Try another."
          ),
      }),
    [existingNames]
  )

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: SAVE_DEFAULT_VALUES,
  })
  const { isSubmitting } = form.formState
  const name = useWatch({ control: form.control, name: 'name' })
  const isNameEmpty = name.trim().length === 0

  const { reset } = form
  useEffect(() => {
    if (!isSaving) return
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    reset({ name: saveNameSeed ?? '' })
    requestAnimationFrame(() => {
      nameInputRef.current?.focus()
      if (saveNameSeed) nameInputRef.current?.select()
    })
    return () => previouslyFocusedRef.current?.focus()
  }, [isSaving, saveNameSeed, reset])

  const handleCancelSave = () => {
    form.reset(SAVE_DEFAULT_VALUES)
    onCancelSave?.()
  }

  const submitSave = async ({ name }: { name: string }) => {
    if (!onSubmitSave) return
    try {
      await onSubmitSave(name)
      form.reset(SAVE_DEFAULT_VALUES)
      onCancelSave?.()
    } catch {
      return
    }
  }

  const renderSaveAction = (variant: 'default' | 'text') =>
    !!onSaveCurrentView && (
      <ButtonTooltip
        type="button"
        size="tiny"
        variant={variant}
        className="shrink-0 px-1.5"
        icon={<PlusIcon />}
        aria-label="Save current filters as a view"
        disabled={!canSaveCurrentFilters}
        onClick={onSaveCurrentView}
        tooltip={{
          content: {
            side: 'bottom',
            text: canSaveCurrentFilters ? 'Save current filters as a view' : saveDisabledReason,
          },
        }}
      />
    )

  return (
    <>
      <div
        id={id}
        className="flex items-center gap-1.5 px-2 py-2 border-b overflow-x-auto hide-scrollbar"
      >
        <span role="status" aria-live="polite" className="sr-only">
          {getStatusMessage({ isSaving, isLoading, isError, isEmpty, count: views.length })}
        </span>

        <AnimatePresence mode="wait" initial={false}>
          {isSaving ? (
            <motion.div
              key="save-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={reduceMotion ? { duration: 0 } : FADE_TRANSITION}
              className="flex items-center gap-1.5 w-full"
            >
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(submitSave)}
                  noValidate
                  className="flex items-center gap-1.5"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="relative shrink-0">
                        <FormControl>
                          <Input
                            {...field}
                            ref={(element) => {
                              field.ref(element)
                              nameInputRef.current = element
                            }}
                            size="tiny"
                            className="w-48 border-transparent bg-transparent shadow-none px-1 hover:border-transparent focus:border-transparent"
                            placeholder="Enter a name for this view"
                            onKeyDown={(event) => {
                              if (event.key !== 'Escape') return
                              event.preventDefault()
                              handleCancelSave()
                            }}
                          />
                        </FormControl>
                        <FormMessage className="absolute left-0 top-full z-10 mt-1 whitespace-nowrap text-xs" />
                      </FormItem>
                    )}
                  />
                  <Button
                    size="tiny"
                    variant="primary"
                    type="submit"
                    className="shrink-0"
                    loading={isSubmitting}
                    disabled={isSubmitting || isNameEmpty}
                  >
                    Save
                  </Button>
                  <ButtonTooltip
                    type="button"
                    size="tiny"
                    variant="text"
                    className="shrink-0 px-1.5"
                    icon={<XIcon />}
                    aria-label="Cancel"
                    onClick={handleCancelSave}
                    disabled={isSubmitting}
                    tooltip={{ content: { side: 'bottom', text: 'Cancel' } }}
                  />
                </form>
              </Form>
            </motion.div>
          ) : (
            <motion.div
              key="pills"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={reduceMotion ? { duration: 0 } : FADE_TRANSITION}
              className="flex items-center gap-1.5 w-full"
            >
              {isLoading && (
                <div className={cn(CHIP_CLASS, 'items-center px-2')}>
                  <Loader2Icon
                    size={12}
                    className="motion-safe:animate-spin text-foreground-lighter"
                  />
                </div>
              )}

              {!isLoading && isError && (
                <div className="flex items-center gap-2 text-xs text-foreground-light">
                  <AlertCircleIcon size={12} className="shrink-0" />
                  Failed to load views
                  <Button size="tiny" variant="text" onClick={onRetry}>
                    Retry
                  </Button>
                </div>
              )}

              {isEmpty && (
                <div className="flex items-center gap-1.5 text-xs text-foreground-lighter whitespace-nowrap px-2">
                  <span>No saved views yet. Set some filters, then press</span>
                  {renderSaveAction('default')}
                  <span>to save them.</span>
                </div>
              )}

              {!isLoading &&
                !isError &&
                views.map((view) => (
                  <LogsViewChip
                    key={view.id}
                    view={view}
                    isActive={view.id === activeViewId}
                    isModified={view.id === activeViewId && isActiveViewModified}
                    isReviewOpen={isReviewOpen}
                    rootRef={view.id === activeViewId ? activeChipRef : undefined}
                    canUpdate={canUpdate && !isPending}
                    canDelete={canDelete && !isPending}
                    onApply={onApply}
                    onReviewChanges={onReviewChanges}
                    onRequestRename={setRenameTarget}
                    onRequestDelete={setDeleteTarget}
                  />
                ))}

              {!isEmpty && (
                <>
                  {renderSaveAction('text')}
                  {activeViewId !== null && (
                    <Button
                      size="tiny"
                      variant="text"
                      className="shrink-0 ml-auto text-foreground-lighter hover:text-foreground"
                      onClick={onClearActiveView}
                    >
                      Clear view
                    </Button>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <RenameViewDialog
        view={renameTarget}
        existingNames={views
          .filter((view) => view.id !== renameTarget?.id)
          .map((view) => view.name)}
        onCancel={() => setRenameTarget(null)}
        onRename={onRename}
      />

      <ConfirmationModal
        variant="destructive"
        visible={deleteTarget !== null}
        confirmLabel="Delete view"
        title="Confirm to delete saved view"
        onCancel={() => setDeleteTarget(null)}
        loading={isPending}
        onConfirm={async () => {
          if (!deleteTarget) return
          try {
            await onDelete(deleteTarget.id)
            setDeleteTarget(null)
          } catch {
            return
          }
        }}
      >
        <p className="text-sm text-foreground-light">
          {`Are you sure you want to delete "${deleteTarget?.name ?? ''}"? This will remove it for everyone in the project.`}
        </p>
      </ConfirmationModal>
    </>
  )
}
