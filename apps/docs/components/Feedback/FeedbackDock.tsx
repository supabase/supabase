'use client'

import { useSendTelemetryEvent } from '~/lib/telemetry'
import { useIsLoggedIn } from 'common'
import { AnimatePresence, motion, MotionConfig, useIsPresent, type Variants } from 'framer-motion'
import { ImagePlus, SquareMousePointer, X } from 'lucide-react'
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type ClipboardEvent,
  type ComponentProps,
  type FormEvent,
  type KeyboardEvent,
  type PropsWithChildren,
  type Ref,
} from 'react'
import { flushSync } from 'react-dom'
import { Button, cn } from 'ui'

import { focusCommentEditor } from './comment-editor.utils'
import { CommentEditor } from './CommentEditor'
import type { DockCorner, DockPlacement } from './corner-snap.utils'
import { fadeDockOut, MORPH_TRANSITION, morphDock } from './dock-morph'
import { MorphWidth } from './DockMorph'
import type { FeedbackDockError } from './feedback-dock.reducer'
import { createFeedbackImages, FEEDBACK_IMAGE_ACCEPT } from './feedback-images.utils'
import { FEEDBACK_LIMITS, type FeedbackPin, type FeedbackVote } from './feedback-schema'
import { DockTooltip, ImageAttachmentList } from './FeedbackDockAttachments'
import { useFeedbackDock } from './FeedbackDockProvider'
import { getPinLabel } from './pins.utils'
import { useCornerDrag, type DockMoveMethod } from './useCornerDrag'

export interface FeedbackDockProps {
  className?: string
}

interface DockTabProps {
  id: string
  label: string
  step: number
  className?: string
}

interface TabLabelProps {
  ref?: Ref<HTMLSpanElement>
  label: string
  direction: RollDirection
}

type DockNoticeProps = ComponentProps<'p'>

interface DiscardConfirmProps {
  onKeepEditing: () => void
  onDiscard: () => void
  className?: string
}

interface ImageButtonProps {
  isImageCapReached: boolean
  isDisabled: boolean
  onImagesSelect: (files: File[]) => void
  className?: string
}

interface PinToggleProps {
  isPicking: boolean
  isPinCapReached: boolean
  isDisabled: boolean
  onToggle: () => void
  className?: string
}

interface SentViewProps extends PropsWithChildren {
  onSendMore: () => void
  className?: string
}

interface CloseButtonProps {
  isSending: boolean
  onClose: () => void
  className?: string
}

type CloseReason = 'dismissed' | 'discarded' | 'after_submit'

type ImageAddMethod = 'picker' | 'paste'

type RollDirection = 1 | -1

const DOCK_COPY: Record<FeedbackVote, { title: string; placeholder: string }> = {
  yes: {
    title: 'What worked well?',
    placeholder: 'Examples, explanations, anything worth keeping',
  },
  no: {
    title: 'What went wrong?',
    placeholder: 'What you tried and where it stopped working',
  },
}

const CAP_NOTICES: Record<'pins' | 'images', string> = {
  pins: 'Pin limit reached. Remove a pin to add another.',
  images: 'Image limit reached. Remove an image to add another.',
}

const REJECTED_IMAGES_NOTICE = "Some files weren't added. Use PNG, JPEG or WebP under 5 MB."

// rolls a full line like a counter; reduced motion keeps only the fade
const TAB_ROLL_VARIANTS: Variants = {
  enter: (direction: RollDirection) => ({
    y: `${direction * 100}%`,
    opacity: 0,
    filter: 'blur(2px)',
  }),
  center: { y: '0%', opacity: 1, filter: 'blur(0px)' },
  exit: (direction: RollDirection) => ({
    y: `${direction * -100}%`,
    opacity: 0,
    filter: 'blur(2px)',
  }),
}

const PIN_TOOLTIP = 'Pin part of the page (mouse only)'

const SUPPORT_URL = 'https://supabase.com/dashboard/support/new'

const CHARACTER_COUNT_THRESHOLD = 1800

const COMPACT_DOCK_QUERY = '(max-width: 767px), (pointer: coarse)'

const INLINE_LINK_CLASSES =
  'text-foreground underline underline-offset-2 hover:text-foreground-light'

// div_svg outranks the tiny button's 14px icon rule
const TOGGLE_CLASSES = 'size-7 shrink-0 p-0 [&_div_svg]:size-4'

// negative margins align icon glyphs with the text
const ACTION_ROW_CLASSES = '-mb-1.5 -ml-2 -mr-1.5 h-7'

const BOX_CLASSES = 'rounded-lg rounded-tl-none border border-default bg-200 p-3 shadow-codeblock'

// one row that scrolls as a whole, so the scrollbar sits at the far right edge
const ISLAND_BOX_CLASSES = cn(
  'grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-2 gap-y-1',
  'max-h-32 overflow-y-auto',
  'rounded-2xl border border-default bg-200 py-2 pl-3 pr-2 shadow-codeblock'
)

// fades the page under the dock so its text doesn't compete with the input
const SCRIM_FADE_CLASSES = 'bg-gradient-to-t from-background via-background/70 to-transparent'

const ISLAND_SCRIM_CLASSES = cn(
  'pointer-events-none fixed inset-x-0 bottom-0 z-50 h-32',
  'transition-opacity duration-200',
  SCRIM_FADE_CLASSES
)

// the sheet's height varies, so its scrim lives inside it: page bg behind, fade above
const COMPACT_SCRIM_CLASSES = 'pointer-events-none absolute inset-0 -z-10 bg-background'

// bottom-2 matches py-2, so the actions stay put at rest and stick while scrolled up
const ISLAND_ACTIONS_CLASSES = 'sticky bottom-2'

// --dock-glow is registered in styles/utilities.css so it can transition
const DISCARD_GLOW_CLASSES = cn(
  '[--dock-glow:hsl(var(--destructive-default)/0.1)]',
  'group-has-[[data-keep-editing]:hover]/dock:[--dock-glow:transparent]'
)

const BOX_GLOW_CLASSES = 'dock-discard-glow'

const DRAGGING_CLASSES = 'data-[dragging]:cursor-grabbing [&[data-dragging]_*]:cursor-grabbing'

const CORNER_POSITIONS: Record<DockCorner, string> = {
  'top-left': 'top-[calc(var(--header-height)+1rem)] left-[max(1rem,env(safe-area-inset-left))]',
  'top-right': 'top-[calc(var(--header-height)+1rem)] right-[max(1rem,env(safe-area-inset-right))]',
  'bottom-left':
    'bottom-[max(1rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))]',
  'bottom-right':
    'bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))]',
}

const COMPACT_POSITION = 'inset-x-0 bottom-0 px-2 pt-2'

const ISLAND_POSITION = cn(
  'inset-x-0 mx-auto w-[min(36rem,calc(100vw-2rem))]',
  'bottom-[max(1rem,env(safe-area-inset-bottom))]'
)

// the picker unmounts once it pins, so the dock owns the announcement
const usePinAnnouncement = ({
  isPicking,
  pins,
}: {
  isPicking: boolean
  pins: FeedbackPin[]
}): string => {
  const [announced, setAnnounced] = useState({ isPicking, pinCount: pins.length, message: '' })
  if (announced.isPicking === isPicking && announced.pinCount === pins.length) {
    return announced.message
  }

  const lastPin = pins.at(-1)
  const message = isPicking
    ? 'Pin mode on. Press Escape to cancel.'
    : lastPin && pins.length > announced.pinCount
      ? `Pinned: ${getPinLabel(lastPin)}`
      : ''
  setAnnounced({ isPicking, pinCount: pins.length, message })
  return message
}

const useIsCompactDock = (): boolean =>
  useSyncExternalStore(subscribeToCompactQuery, getIsCompact, getIsCompactOnServer)

const subscribeToCompactQuery = (onChange: () => void) => {
  const query = window.matchMedia(COMPACT_DOCK_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

const getIsCompact = () => window.matchMedia(COMPACT_DOCK_QUERY).matches

const getIsCompactOnServer = () => false

const focusOnMount = (node: HTMLElement | null) => {
  node?.focus()
}

const restoreFocus = (opener: HTMLElement | null) => {
  if (opener?.isConnected) {
    opener.focus({ preventScroll: true })
    return
  }
  const main = document.querySelector('main')
  if (!main) return
  if (!main.hasAttribute('tabindex')) main.tabIndex = -1
  main.focus({ preventScroll: true })
}

const getErrorMessage = (error: FeedbackDockError): string => {
  if (error.kind === 'attachments_too_large') return 'Remove some pins, then try again'
  if (error.isOffline) return "You're offline. Reconnect, then retry."
  if (error.kind === 'upload_failed') return "Couldn't upload images. Retry to send them."
  return "Couldn't send feedback"
}

export const FeedbackDock = ({ className }: FeedbackDockProps) => {
  const { state, actions, openRequest, canSubmit, isIslandVariant, send, retry } = useFeedbackDock()
  const sendTelemetryEvent = useSendTelemetryEvent()
  const isLoggedIn = useIsLoggedIn()
  const isCompact = useIsCompactDock()
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false)
  const [hasRejectedImages, setHasRejectedImages] = useState(false)
  const dockRef = useRef<HTMLElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const wasOpenRef = useRef(false)
  const cancelOpenMorphRef = useRef<(() => void) | null>(null)
  const isClosingRef = useRef(false)
  const titleId = useId()
  const pinAnnouncement = usePinAnnouncement({
    isPicking: state.isPicking,
    pins: state.draft.pins,
  })

  const handlePlacementChange = ({
    placement,
    method,
  }: {
    placement: DockPlacement
    method: DockMoveMethod
  }) => {
    actions.setPlacement(placement)
    sendTelemetryEvent({ action: 'docs_feedback_dock_moved', properties: { placement, method } })
  }

  const { dragProps } = useCornerDrag({
    targetRef: dockRef,
    placement: state.placement,
    canCenter: isIslandVariant,
    isDisabled: isCompact,
    onPlacementChange: handlePlacementChange,
  })

  useLayoutEffect(() => {
    const dock = dockRef.current
    const opener = openRequest.opener ?? document.activeElement
    const canMorphFromOpener = opener && opener !== document.body && opener.isConnected
    if (state.isOpen && !wasOpenRef.current && dock && canMorphFromOpener) {
      cancelOpenMorphRef.current = morphDock({ from: opener.getBoundingClientRect(), dock })
    }
    wasOpenRef.current = state.isOpen
  }, [state.isOpen, openRequest])

  // exception: open requests come from outside the dock, even a repeat vote
  useEffect(() => {
    const opener = openRequest.opener ?? document.activeElement
    if (
      opener instanceof HTMLElement &&
      opener !== document.body &&
      !dockRef.current?.contains(opener)
    ) {
      openerRef.current = opener
    }
    focusCommentEditor(editorRef.current)
  }, [openRequest])

  const { draft, vote, submitStatus, error } = state
  if (!state.isOpen || !vote) return null

  const hasDraft = draft.comment.trim() !== '' || draft.pins.length > 0 || draft.images.length > 0
  const isSent = submitStatus === 'sent'
  const isSending = submitStatus === 'sending'
  const isLocked = isSending || state.submitProgress === 'comment_saved'
  const isRetry =
    submitStatus === 'error' && (error?.kind === 'insert_failed' || error?.kind === 'upload_failed')
  const canSend = canSubmit && draft.comment.trim() !== ''
  const isPinCapReached = draft.pins.length >= FEEDBACK_LIMITS.pins
  const isImageCapReached = draft.images.length >= FEEDBACK_LIMITS.images
  const copy = DOCK_COPY[vote]
  const tab = isSent ? { label: 'Feedback sent', step: 1 } : { label: copy.title, step: 0 }
  const isIsland = !isCompact && state.placement === 'center'

  const closeDock = ({ reason, hadDraft }: { reason: CloseReason; hadDraft: boolean }) => {
    // closing mid-send would drop a comment row that may already be saved
    if (isSending || isClosingRef.current) return
    sendTelemetryEvent({ action: 'docs_feedback_dock_closed', properties: { reason, hadDraft } })

    const finish = () => {
      isClosingRef.current = false
      restoreFocus(openerRef.current)
      setHasRejectedImages(false)
      actions.closeDock()
    }
    cancelOpenMorphRef.current?.()
    const fade = dockRef.current ? fadeDockOut(dockRef.current) : null
    if (!fade) {
      finish()
      return
    }
    isClosingRef.current = true
    void fade.then(finish)
  }

  const requestClose = () => {
    if (isSending) return
    if (isSent) {
      closeDock({ reason: 'after_submit', hadDraft: false })
    } else if (hasDraft) {
      setIsConfirmingDiscard(true)
    } else {
      closeDock({ reason: 'dismissed', hadDraft: false })
    }
  }

  const handleDiscard = () => closeDock({ reason: 'discarded', hadDraft: true })

  const handleKeepEditing = () => {
    setIsConfirmingDiscard(false)
    focusCommentEditor(editorRef.current)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape') {
      dragProps.onKeyDown(event)
      return
    }
    if (state.isPicking) {
      actions.setPicking(false)
    } else if (isConfirmingDiscard) {
      handleKeepEditing()
    } else {
      requestClose()
    }
  }

  const handlePinToggle = () => actions.setPicking(!state.isPicking)

  const addImageFiles = ({ files, method }: { files: File[]; method: ImageAddMethod }) => {
    const { images, rejectedCount } = createFeedbackImages(files)
    setHasRejectedImages(rejectedCount > 0)
    if (images.length === 0) return
    actions.addImages(images)
    sendTelemetryEvent({
      action: 'docs_feedback_image_added',
      properties: {
        imageCount: Math.min(draft.images.length + images.length, FEEDBACK_LIMITS.images),
        method,
      },
    })
  }

  const handleImagesSelect = (files: File[]) => addImageFiles({ files, method: 'picker' })

  // text wins so a rich paste that also carries a rendered image still pastes text
  const handlePaste = (event: ClipboardEvent<HTMLFormElement>) => {
    const { clipboardData } = event
    if (isLocked || clipboardData.types.includes('text/plain')) return
    const files = Array.from(clipboardData.files)
    if (files.length === 0) return
    event.preventDefault()
    addImageFiles({ files, method: 'paste' })
  }

  const handlePinRemove = (index: number) => {
    actions.removePin(index)
    sendTelemetryEvent({
      action: 'docs_feedback_pin_removed',
      properties: { pinCount: draft.pins.length - 1 },
    })
  }

  const handleImageRemove = (path: string) => {
    actions.removeImage(path)
    setHasRejectedImages(false)
    sendTelemetryEvent({
      action: 'docs_feedback_image_removed',
      properties: { imageCount: draft.images.length - 1 },
    })
    focusCommentEditor(editorRef.current)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSend || isSending) return

    if (isRetry) {
      retry()
    } else {
      send()
    }
  }

  const handleSendMore = () => {
    flushSync(() => {
      setIsConfirmingDiscard(false)
      setHasRejectedImages(false)
      actions.sendMore()
    })
    focusCommentEditor(editorRef.current)
  }

  return (
    <>
      <div
        aria-hidden
        data-feedback-ui
        className={cn(ISLAND_SCRIM_CLASSES, isIsland ? 'opacity-100' : 'opacity-0')}
      />
      <section
        ref={dockRef}
        role="dialog"
        aria-modal={false}
        aria-labelledby={titleId}
        data-feedback-ui
        {...dragProps}
        onKeyDown={handleKeyDown}
        className={cn(
          'group/dock fixed z-50 flex flex-col',
          'max-h-[calc(100dvh-var(--header-height)-2rem)]',
          isCompact
            ? COMPACT_POSITION
            : cn(
                'cursor-grab touch-none',
                DRAGGING_CLASSES,
                state.placement === 'center'
                  ? ISLAND_POSITION
                  : cn('w-75', CORNER_POSITIONS[state.placement])
              ),
          className
        )}
      >
        {isCompact ? (
          <div aria-hidden className={COMPACT_SCRIM_CLASSES}>
            <div className={cn('absolute inset-x-0 bottom-full h-12', SCRIM_FADE_CLASSES)} />
          </div>
        ) : null}
        <MotionConfig reducedMotion="user">
          {/* the island has no tab, so its title only names the dialog */}
          {isIsland ? (
            <h2 id={titleId} aria-live="polite" className="sr-only">
              {tab.label}
            </h2>
          ) : (
            <header className="flex shrink-0 select-none items-center justify-between gap-1">
              <DockTab id={titleId} label={tab.label} step={tab.step} />
              <CloseButton isSending={isSending} onClose={requestClose} />
            </header>
          )}
          {isSent ? (
            <SentView
              onSendMore={handleSendMore}
              className={
                isIsland
                  ? cn(ISLAND_BOX_CLASSES, 'flex flex-row items-center gap-3 py-2')
                  : BOX_CLASSES
              }
            >
              {isIsland ? (
                <CloseButton isSending={isSending} onClose={requestClose} className="ml-auto" />
              ) : null}
            </SentView>
          ) : (
            <form
              data-dock-box
              onSubmit={handleSubmit}
              onPaste={handlePaste}
              className={cn(
                isIsland ? ISLAND_BOX_CLASSES : cn('flex min-h-0 flex-col gap-3', BOX_CLASSES),
                BOX_GLOW_CLASSES,
                isConfirmingDiscard ? DISCARD_GLOW_CLASSES : null
              )}
            >
              <div
                data-dock-reveal
                // room for focus rings the scroll clip would crop
                className={cn(
                  '-m-1 flex min-h-0 flex-col p-1',
                  isIsland ? 'gap-2' : 'gap-3 overflow-y-auto'
                )}
              >
                {draft.images.length > 0 ? (
                  <ImageAttachmentList
                    images={draft.images}
                    isReadOnly={isLocked}
                    onImageRemove={handleImageRemove}
                  />
                ) : null}
                <CommentEditor
                  ref={editorRef}
                  comment={draft.comment}
                  pins={draft.pins}
                  isReadOnly={isLocked}
                  // the island hides its title, so the question becomes the placeholder
                  placeholder={isIsland ? copy.title : copy.placeholder}
                  maxLength={FEEDBACK_LIMITS.comment}
                  labelledBy={titleId}
                  onCommentChange={actions.setComment}
                  onPinRemove={handlePinRemove}
                  className={isIsland ? 'min-h-7 py-0.5' : 'min-h-16'}
                />
                {draft.comment.length > CHARACTER_COUNT_THRESHOLD ? (
                  <DockNotice className="self-end tabular-nums">
                    {`${draft.comment.length}/${FEEDBACK_LIMITS.comment}`}
                  </DockNotice>
                ) : null}
                {state.capNotice ? (
                  <DockNotice role="status">{CAP_NOTICES[state.capNotice]}</DockNotice>
                ) : null}
                {hasRejectedImages ? (
                  <DockNotice role="status">{REJECTED_IMAGES_NOTICE}</DockNotice>
                ) : null}
                {error ? (
                  <p role="alert" className="text-xs text-destructive">
                    {getErrorMessage(error)}
                  </p>
                ) : null}
              </div>
              {isConfirmingDiscard ? (
                <DiscardConfirm
                  onKeepEditing={handleKeepEditing}
                  onDiscard={handleDiscard}
                  className={isIsland ? cn('m-0', ISLAND_ACTIONS_CLASSES) : undefined}
                />
              ) : (
                <div
                  data-dock-reveal
                  className={cn(
                    'flex shrink-0 items-center',
                    isIsland ? cn('h-7 gap-0.5', ISLAND_ACTIONS_CLASSES) : ACTION_ROW_CLASSES
                  )}
                >
                  <ImageButton
                    isImageCapReached={isImageCapReached}
                    isDisabled={isLocked}
                    onImagesSelect={handleImagesSelect}
                  />
                  {isCompact ? null : (
                    <PinToggle
                      isPicking={state.isPicking}
                      isPinCapReached={isPinCapReached}
                      isDisabled={isLocked}
                      onToggle={handlePinToggle}
                    />
                  )}
                  <Button
                    type="submit"
                    variant="primary"
                    loading={isSending}
                    disabled={!canSend}
                    className={isIsland ? 'mx-1' : 'ml-auto'}
                  >
                    {isRetry ? 'Retry' : 'Submit'}
                  </Button>
                  {isIsland ? <CloseButton isSending={isSending} onClose={requestClose} /> : null}
                </div>
              )}
              {isLoggedIn ? (
                <DockNotice data-dock-reveal className={isIsland ? 'col-span-2' : undefined}>
                  Linked to your account
                </DockNotice>
              ) : null}
            </form>
          )}
        </MotionConfig>
        <p role="status" className="sr-only">
          {pinAnnouncement}
        </p>
      </section>
    </>
  )
}

const DockTab = ({ id, label, step, className }: DockTabProps) => {
  const [roll, setRoll] = useState<{ step: number; direction: RollDirection }>({
    step,
    direction: 1,
  })
  if (roll.step !== step) setRoll({ step, direction: step > roll.step ? 1 : -1 })

  return (
    <h2
      id={id}
      data-dock-tab
      className={cn(
        'relative z-[1] -mb-px min-w-0 rounded-t-lg border border-b-0 border-default',
        'bg-200 text-xs font-medium text-foreground',
        className
      )}
    >
      <MorphWidth>
        <span data-dock-reveal aria-live="polite" className="relative block">
          <AnimatePresence mode="popLayout" initial={false} custom={roll.direction}>
            <TabLabel key={label} label={label} direction={roll.direction} />
          </AnimatePresence>
        </span>
      </MorphWidth>
    </h2>
  )
}

// the leaving label is hidden so it drops out of the dialog's name mid-roll
const TabLabel = ({ ref, label, direction }: TabLabelProps) => {
  const isPresent = useIsPresent()

  return (
    <motion.span
      ref={ref}
      custom={direction}
      variants={TAB_ROLL_VARIANTS}
      initial="enter"
      animate="center"
      exit="exit"
      transition={MORPH_TRANSITION}
      aria-hidden={!isPresent}
      className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2"
    >
      {label}
    </motion.span>
  )
}

const DockNotice = ({ className, ...props }: DockNoticeProps) => (
  <p {...props} className={cn('text-xs text-foreground-lighter', className)} />
)

const DiscardConfirm = ({ onKeepEditing, onDiscard, className }: DiscardConfirmProps) => (
  <div
    role="group"
    aria-label="Discard feedback?"
    className={cn('flex items-center justify-end gap-1.5', ACTION_ROW_CLASSES, className)}
  >
    <Button ref={focusOnMount} variant="default" data-keep-editing onClick={onKeepEditing}>
      Keep editing
    </Button>
    <Button variant="danger" onClick={onDiscard}>
      Discard
    </Button>
  </div>
)

const ImageButton = ({
  isImageCapReached,
  isDisabled,
  onImagesSelect,
  className,
}: ImageButtonProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => inputRef.current?.click()
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onImagesSelect(Array.from(event.currentTarget.files ?? []))
    // so picking the same file again still fires change
    event.currentTarget.value = ''
  }

  return (
    <>
      <DockTooltip label={isImageCapReached ? 'Image limit reached' : 'Attach images'}>
        <Button
          variant="text"
          aria-label="Attach images"
          disabled={isImageCapReached || isDisabled}
          focusableWhenDisabled
          className={cn(TOGGLE_CLASSES, className)}
          icon={<ImagePlus />}
          onClick={handleClick}
        />
      </DockTooltip>
      <input
        ref={inputRef}
        type="file"
        accept={FEEDBACK_IMAGE_ACCEPT}
        multiple
        hidden
        tabIndex={-1}
        onChange={handleChange}
      />
    </>
  )
}

const PinToggle = ({
  isPicking,
  isPinCapReached,
  isDisabled,
  onToggle,
  className,
}: PinToggleProps) => (
  <DockTooltip label={isPinCapReached ? 'Pin limit reached' : PIN_TOOLTIP}>
    <Button
      variant="text"
      aria-label="Pin an element"
      aria-pressed={isPicking}
      disabled={isPinCapReached || isDisabled}
      focusableWhenDisabled
      className={cn(
        TOGGLE_CLASSES,
        'aria-pressed:bg-brand/15 aria-pressed:[&_svg]:text-brand-600',
        'dark:aria-pressed:[&_svg]:text-brand',
        className
      )}
      icon={<SquareMousePointer />}
      onClick={onToggle}
    />
  </DockTooltip>
)

const SentView = ({ onSendMore, children, className }: SentViewProps) => (
  <div className={cn('flex flex-col items-start gap-3', className)}>
    <p className="text-xs text-foreground-light">
      Need help with a project?{' '}
      <a
        href={SUPPORT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={INLINE_LINK_CLASSES}
      >
        Open a support request
      </a>
    </p>
    <Button ref={focusOnMount} variant="default" onClick={onSendMore}>
      Send more
    </Button>
    {children}
  </div>
)

const CloseButton = ({ isSending, onClose, className }: CloseButtonProps) => (
  <DockTooltip label={isSending ? 'Sending…' : 'Close'}>
    <Button
      variant="text"
      aria-label="Close feedback"
      disabled={isSending}
      focusableWhenDisabled
      className={cn('size-7 shrink-0 p-0', className)}
      icon={<X />}
      onClick={onClose}
    />
  </DockTooltip>
)
