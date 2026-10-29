'use client'

import { useSendTelemetryEvent } from '~/lib/telemetry'
import { useIsLoggedIn } from 'common'
import { AnimatePresence, motion, MotionConfig, useIsPresent, type Variants } from 'motion/react'
import { ImagePlus, SquareMousePointer, X } from 'lucide-react'
import {
  useCallback,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ClipboardEvent,
  type ComponentProps,
  type FormEvent,
  type KeyboardEvent,
  type Ref,
} from 'react'
import { flushSync } from 'react-dom'
import { Button, cn } from 'ui'

import { captureScreenshot, type ScreenRect } from './capture-screenshot'
import { focusCommentEditor } from './comment-editor.utils'
import { CommentEditor } from './CommentEditor'
import { fadeDockOut, MORPH_TRANSITION, morphDock } from './dock-morph'
import { MorphWidth } from './MorphWidth'
import type { FeedbackDockError } from './feedback-dock.reducer'
import { createFeedbackImages } from './feedback-images.utils'
import { FEEDBACK_LIMITS, type FeedbackPin, type FeedbackVote } from './feedback-schema'
import { DockTooltip, ImageAttachmentList } from './FeedbackDockAttachments'
import { useFeedbackDock } from './FeedbackDockProvider'
import { getPinLabel } from './pins.utils'
import { ScreenshotArea } from './ScreenshotArea'

interface OpenDockProps {
  vote: FeedbackVote
}

interface DockTabProps {
  id: string
  label: string
  step: number
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
}

interface CaptureButtonProps {
  isImageCapReached: boolean
  isDisabled: boolean
  isCapturing: boolean
  onClick: () => void
}

interface PinToggleProps {
  isPicking: boolean
  isPinCapReached: boolean
  isDisabled: boolean
  onToggle: () => void
}

interface SentViewProps {
  onSendMore: () => void
}

interface CloseButtonProps {
  isSending: boolean
  onClose: () => void
}

type CloseReason = 'dismissed' | 'discarded' | 'after_submit'

type ImageAddMethod = 'paste' | 'capture'

type ImageNotice = 'rejected' | 'capture_failed'

type ScreenshotStatus = 'idle' | 'selecting' | 'capturing'

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

const IMAGE_NOTICES: Record<ImageNotice, string> = {
  rejected: "Some files weren't added. Use PNG, JPEG or WebP under 5 MB.",
  capture_failed: "Couldn't capture the screenshot. Try again.",
}

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

const COMPACT_DOCK_QUERY = '(max-width: 767px), (pointer: coarse)'

// the div svg selector overrides the 14px icon size of the tiny button
const TOGGLE_CLASSES = 'size-7 shrink-0 p-0 [&_div_svg]:size-4'

const ACTION_ROW_CLASSES = '-mb-1.5 -ml-2 -mr-1.5 h-7'

const BOX_CLASSES = 'rounded-lg rounded-tl-none border border-default bg-200 p-3 shadow-codeblock'

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

export const FeedbackDock = () => {
  const { state } = useFeedbackDock()
  return state.isOpen && state.vote ? <OpenDock vote={state.vote} /> : null
}

const OpenDock = ({ vote }: OpenDockProps) => {
  const { state, actions, canSubmit, send, dockRef, editorRef, openerRef } = useFeedbackDock()
  const sendTelemetryEvent = useSendTelemetryEvent()
  const isLoggedIn = useIsLoggedIn()
  const isCompact = useIsCompactDock()
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false)
  const [imageNotice, setImageNotice] = useState<ImageNotice | null>(null)
  const [screenshotStatus, setScreenshotStatus] = useState<ScreenshotStatus>('idle')
  const cancelOpenMorphRef = useRef<(() => void) | null>(null)
  const isClosingRef = useRef(false)
  const titleId = useId()
  const pinAnnouncement = usePinAnnouncement({
    isPicking: state.isPicking,
    pins: state.draft.pins,
  })

  // a stable ref callback runs once on mount, before paint, so the morph starts from the opener
  const handleDockRef = useCallback(
    (dock: HTMLElement) => {
      dockRef.current = dock
      const opener = openerRef.current
      if (opener?.isConnected) {
        cancelOpenMorphRef.current = morphDock({ from: opener.getBoundingClientRect(), dock })
      }
      focusCommentEditor(editorRef.current)
      return () => {
        dockRef.current = null
      }
    },
    [dockRef, editorRef, openerRef]
  )

  const { draft, submitStatus, error } = state

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

  const closeDock = (reason: CloseReason) => {
    // closing mid-send would drop a comment row that may already be saved
    if (isSending || isClosingRef.current) return
    sendTelemetryEvent({ action: 'docs_feedback_dock_closed', properties: { reason } })

    const finish = () => {
      isClosingRef.current = false
      restoreFocus(openerRef.current)
      setImageNotice(null)
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
      closeDock('after_submit')
    } else if (hasDraft) {
      setIsConfirmingDiscard(true)
    } else {
      closeDock('dismissed')
    }
  }

  const handleDiscard = () => closeDock('discarded')

  const handleKeepEditing = () => {
    setIsConfirmingDiscard(false)
    focusCommentEditor(editorRef.current)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape') return
    if (state.isPicking) {
      actions.setPicking(false)
      focusCommentEditor(editorRef.current)
    } else if (isConfirmingDiscard) {
      handleKeepEditing()
    } else {
      requestClose()
    }
  }

  const handlePinToggle = () => actions.setPicking(!state.isPicking)

  const addImageFiles = ({ files, method }: { files: File[]; method: ImageAddMethod }) => {
    const { images, rejectedCount } = createFeedbackImages(files)
    setImageNotice(rejectedCount > 0 ? 'rejected' : null)
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

  const handleCaptureStart = () => setScreenshotStatus('selecting')

  const handleCaptureCancel = () => {
    setScreenshotStatus('idle')
    focusCommentEditor(editorRef.current)
  }

  const handleAreaSelect = (area: ScreenRect) => {
    setScreenshotStatus('capturing')
    void captureScreenshot(area)
      .catch(() => null)
      .then((file) => {
        setScreenshotStatus('idle')
        if (file) {
          addImageFiles({ files: [file], method: 'capture' })
        } else {
          setImageNotice('capture_failed')
        }
        focusCommentEditor(editorRef.current)
      })
  }

  // prefer text so a rich paste that also has a rendered image still pastes text
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
    setImageNotice(null)
    sendTelemetryEvent({
      action: 'docs_feedback_image_removed',
      properties: { imageCount: draft.images.length - 1 },
    })
    focusCommentEditor(editorRef.current)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    send()
  }

  const handleSendMore = () => {
    flushSync(() => {
      setIsConfirmingDiscard(false)
      setImageNotice(null)
      actions.sendMore()
    })
    focusCommentEditor(editorRef.current)
  }

  return (
    <section
      ref={handleDockRef}
      role="dialog"
      aria-modal={false}
      aria-labelledby={titleId}
      data-feedback-ui
      onKeyDown={handleKeyDown}
      className={cn(
        'group/dock fixed z-50 flex flex-col',
        screenshotStatus === 'selecting' ? 'invisible' : null,
        'max-h-[calc(100dvh-var(--header-height)-2rem)]',
        isCompact
          ? 'inset-x-0 bottom-0 px-2 pt-2'
          : cn(
              'w-75 bottom-[max(1rem,env(safe-area-inset-bottom))]',
              'right-[max(1rem,env(safe-area-inset-right))]'
            )
      )}
    >
      {isCompact ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-background">
          <div
            className={cn(
              'absolute inset-x-0 bottom-full h-12',
              'bg-gradient-to-t from-background via-background/70 to-transparent'
            )}
          />
        </div>
      ) : null}
      <MotionConfig reducedMotion="user">
        <div className="flex shrink-0 items-center justify-between gap-1">
          <DockTab id={titleId} label={tab.label} step={tab.step} />
          <CloseButton isSending={isSending} onClose={requestClose} />
        </div>
        {isSent ? (
          <SentView onSendMore={handleSendMore} />
        ) : (
          <form
            data-dock-box
            onSubmit={handleSubmit}
            onPaste={handlePaste}
            className={cn(
              'flex min-h-0 flex-col gap-3',
              BOX_CLASSES,
              'dock-discard-glow',
              isConfirmingDiscard
                ? cn(
                    '[--dock-glow:hsl(var(--destructive-default)/0.1)]',
                    'group-has-[[data-keep-editing]:hover]/dock:[--dock-glow:transparent]'
                  )
                : null
            )}
          >
            <div data-dock-reveal className="-m-1 flex min-h-0 flex-col gap-3 overflow-y-auto p-1">
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
                placeholder={copy.placeholder}
                maxLength={FEEDBACK_LIMITS.comment}
                labelledBy={titleId}
                onCommentChange={actions.setComment}
                onPinRemove={handlePinRemove}
                className="min-h-16"
              />
              {draft.comment.length > 1800 ? (
                <DockNotice className="self-end tabular-nums">
                  {`${draft.comment.length}/${FEEDBACK_LIMITS.comment}`}
                </DockNotice>
              ) : null}
              {state.capNotice ? (
                <DockNotice role="status">{CAP_NOTICES[state.capNotice]}</DockNotice>
              ) : null}
              {imageNotice ? (
                <DockNotice role="status">{IMAGE_NOTICES[imageNotice]}</DockNotice>
              ) : null}
              {error ? (
                <p role="alert" className="text-xs text-destructive">
                  {getErrorMessage(error)}
                </p>
              ) : null}
            </div>
            {isConfirmingDiscard ? (
              <DiscardConfirm onKeepEditing={handleKeepEditing} onDiscard={handleDiscard} />
            ) : (
              <div
                data-dock-reveal
                className={cn('flex shrink-0 items-center', ACTION_ROW_CLASSES)}
              >
                <CaptureButton
                  isImageCapReached={isImageCapReached}
                  isDisabled={isLocked}
                  isCapturing={screenshotStatus === 'capturing'}
                  onClick={handleCaptureStart}
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
                  className="ml-auto"
                >
                  {isRetry ? 'Retry' : 'Submit'}
                </Button>
              </div>
            )}
            {isLoggedIn ? <DockNotice data-dock-reveal>Linked to your account</DockNotice> : null}
          </form>
        )}
      </MotionConfig>
      {screenshotStatus === 'selecting' ? (
        <ScreenshotArea onAreaSelect={handleAreaSelect} onCancel={handleCaptureCancel} />
      ) : null}
      <p role="status" className="sr-only">
        {pinAnnouncement}
      </p>
    </section>
  )
}

const DockTab = ({ id, label, step }: DockTabProps) => {
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
        'bg-200 text-xs font-medium text-foreground'
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

// hide the exiting label so the dialog name does not include it
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

const DiscardConfirm = ({ onKeepEditing, onDiscard }: DiscardConfirmProps) => (
  <div
    role="group"
    aria-label="Discard feedback?"
    className={cn('flex items-center justify-end gap-1.5', ACTION_ROW_CLASSES)}
  >
    <Button ref={focusOnMount} variant="default" data-keep-editing onClick={onKeepEditing}>
      Keep editing
    </Button>
    <Button variant="danger" onClick={onDiscard}>
      Discard
    </Button>
  </div>
)

const CaptureButton = ({
  isImageCapReached,
  isDisabled,
  isCapturing,
  onClick,
}: CaptureButtonProps) => (
  <DockTooltip label={isImageCapReached ? 'Image limit reached' : 'Capture a screenshot'}>
    <Button
      variant="text"
      aria-label="Capture a screenshot"
      disabled={isImageCapReached || isDisabled}
      loading={isCapturing}
      focusableWhenDisabled
      className={TOGGLE_CLASSES}
      icon={<ImagePlus />}
      onClick={onClick}
    />
  </DockTooltip>
)

const PinToggle = ({ isPicking, isPinCapReached, isDisabled, onToggle }: PinToggleProps) => (
  <DockTooltip label={isPinCapReached ? 'Pin limit reached' : 'Click part of the page to pin it'}>
    <Button
      variant="text"
      aria-label="Pin an element"
      aria-pressed={isPicking}
      disabled={isPinCapReached || isDisabled}
      focusableWhenDisabled
      className={cn(
        TOGGLE_CLASSES,
        'aria-pressed:bg-brand/15 aria-pressed:[&_svg]:text-brand-600',
        'dark:aria-pressed:[&_svg]:text-brand'
      )}
      icon={<SquareMousePointer />}
      onClick={onToggle}
    />
  </DockTooltip>
)

const SentView = ({ onSendMore }: SentViewProps) => (
  <div className={cn('flex flex-col items-start gap-3', BOX_CLASSES)}>
    <p className="text-xs text-foreground-light">
      Need help with a project?{' '}
      <a
        href="https://supabase.com/dashboard/support/new"
        target="_blank"
        rel="noopener noreferrer"
        className="text-foreground underline underline-offset-2 hover:text-foreground-light"
      >
        Open a support request
      </a>
    </p>
    <Button ref={focusOnMount} variant="default" onClick={onSendMore}>
      Send more
    </Button>
  </div>
)

const CloseButton = ({ isSending, onClose }: CloseButtonProps) => (
  <DockTooltip label={isSending ? 'Sending…' : 'Close'}>
    <Button
      variant="text"
      aria-label="Close feedback"
      disabled={isSending}
      focusableWhenDisabled
      className="size-7 shrink-0 p-0"
      icon={<X />}
      onClick={onClose}
    />
  </DockTooltip>
)
