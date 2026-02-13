import { useDebounce } from '@uidotdev/usehooks'
import { AnimatePresence, motion } from 'framer-motion'
import { toPng } from 'html-to-image'
import { Camera, CircleCheck, HelpCircle, Image as ImageIcon, Upload, X } from 'lucide-react'
import { useRouter } from 'next/router'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { InlineLinkClassName } from 'components/ui/InlineLink'
import { SupportLink } from 'components/interfaces/Support/SupportLink'
import { useFeedbackCategoryQuery } from 'data/feedback/feedback-category'
import { useSendFeedbackMutation } from 'data/feedback/feedback-send'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { timeout } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  PopoverSeparator_Shadcn_,
  TextArea_Shadcn_,
} from 'ui'
import { Admonition } from 'ui-patterns'
import {
  convertB64toBlob,
  isLikelySupportRequest,
  uploadAttachment,
} from './FeedbackDropdown.utils'

interface FeedbackWidgetProps {
  onClose: () => void
  onSwitchToIssueOptions: () => void
}

export const FeedbackWidget = ({ onClose, onSwitchToIssueOptions }: FeedbackWidgetProps) => {
  const router = useRouter()
  const { profile } = useProfile()
  const { ref, slug } = useParams()
  const { data: org } = useSelectedOrganizationQuery()

  const uploadButtonRef = useRef(null)
  const [feedback, setFeedback] = useState('')
  const [isSending, setSending] = useState(false)
  const [isSavingScreenshot, setIsSavingScreenshot] = useState(false)
  const [isFeedbackSent, setIsFeedbackSent] = useState(false)

  const debouncedFeedback = useDebounce(feedback, 500)

  const [storedFeedback, setStoredFeedback] = useLocalStorageQuery<string | null>(
    LOCAL_STORAGE_KEYS.FEEDBACK_WIDGET_CONTENT,
    null
  )
  const [screenshot, setScreenshot, { isSuccess }] = useLocalStorageQuery<string | null>(
    LOCAL_STORAGE_KEYS.FEEDBACK_WIDGET_SCREENSHOT,
    null
  )

  const { data: category } = useFeedbackCategoryQuery({ prompt: debouncedFeedback })

  // Use client-side heuristic for immediate feedback, AI result takes precedence when available
  const isLikelySupport = isLikelySupportRequest(feedback)
  const effectiveCategory = category ?? (isLikelySupport ? 'support' : null)

  const { mutate: sendEvent } = useSendEventMutation()
  const { mutate: submitFeedback } = useSendFeedbackMutation({
    onSuccess: () => {
      setIsFeedbackSent(true)
      setFeedback('')
      setStoredFeedback(null)
      setScreenshot(null)
      setSending(false)
    },
    onError: (error) => {
      toast.error(`Failed to submit feedback: ${error.message}`)
      setSending(false)
    },
  })

  const captureScreenshot = async () => {
    setIsSavingScreenshot(true)

    function filter(node: HTMLElement) {
      if ((node?.children ?? []).length > 0) {
        return node.children[0].id !== 'feedback-widget'
      }
      return true
    }

    // Give time for dropdown to close
    await timeout(100)
    toPng(document.body, { filter })
      .then((dataUrl: any) => setScreenshot(dataUrl))
      .catch(() => toast.error('Failed to capture screenshot'))
      .finally(() => setIsSavingScreenshot(false))
  }

  const onFilesUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    event.persist()
    const [file] = event.target.files || (event as any).dataTransfer.items

    const reader = new FileReader()
    reader.onload = function (event) {
      const dataUrl = event.target?.result
      if (typeof dataUrl === 'string') setScreenshot(dataUrl)
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const handlePasteEvent = async () => {
    // [Joshen] Support pasting images via Cmd / Ctrl + V
    const [data] = await navigator.clipboard.read()

    if (screenshot === undefined && data.types[0] === 'image/png') {
      const blob = await data.getType('image/png')
      const reader = new FileReader()
      reader.onload = function (event) {
        const dataUrl = event.target?.result
        if (typeof dataUrl === 'string') setScreenshot(dataUrl)
      }
      reader.readAsDataURL(blob)
    }
  }

  const sendFeedback = async () => {
    if (feedback.length === 0 && screenshot !== undefined) {
      return toast.error('Please include a message in your feedback.')
    } else if (feedback.length > 0) {
      setSending(true)

      const attachmentUrl =
        screenshot && profile?.gotrue_id
          ? await uploadAttachment({
              image: screenshot,
              userId: profile.gotrue_id,
            })
          : undefined
      const formattedFeedback =
        attachmentUrl !== undefined ? `${feedback}\n\nAttachments:\n${attachmentUrl}` : feedback

      submitFeedback({
        projectRef: ref,
        organizationSlug: slug,
        message: formattedFeedback,
        pathname: router.asPath,
      })
    }
  }

  // Hydrate form from localStorage once it's ready; deps intentionally omit storedFeedback/screenshot
  // so we don't overwrite user edits when those values change after initial load.
  useEffect(() => {
    if (storedFeedback) setFeedback(storedFeedback)
    if (screenshot) setScreenshot(screenshot)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once when localStorage is ready only
  }, [isSuccess])

  // Persist debounced input to localStorage; only re-run when debounced value changes.
  useEffect(() => {
    if (debouncedFeedback.length > 0) setStoredFeedback(debouncedFeedback)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setStoredFeedback is stable; only sync on debounced value
  }, [debouncedFeedback])

  const ThanksMessageView = () => (
    <>
      <div className="py-6 px-4 grid gap-4 text-center text-foreground-light">
        <CircleCheck className="mx-auto text-brand-500" size={24} />
        <div className="flex flex-col gap-1">
          <p className="text-foreground text-base">Your feedback has been sent. Thanks!</p>
          <p className="text-sm text-balance">
            We don’t always respond to feedback. If you need help with your project, use the button
            below.
          </p>
        </div>
      </div>
      <PopoverSeparator_Shadcn_ />
      <div className="px-4 pt-4 pb-4 flex flex-row items-center justify-between">
        <Button type="default" size="tiny" onClick={onSwitchToIssueOptions}>
          Get help
        </Button>
        <Button type="default" size="tiny" onClick={onClose}>
          Close
        </Button>
      </div>
    </>
  )

  return isFeedbackSent ? (
    <ThanksMessageView />
  ) : (
    <>
      <div className="p-4">
        <TextArea_Shadcn_
          placeholder="My idea for improving Supabase is..."
          rows={6}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          onPaste={handlePasteEvent}
          className="text-sm mb-1 resize-none"
        />
      </div>

      <AnimatePresence>
        {effectiveCategory === 'support' && (
          <motion.div
            key="support-alert"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
          >
            <Admonition
              type="caution"
              title="This looks like an issue that’s better handled by support"
              className="rounded-none border-x-0 border-b-0"
            >
              <p>
                Please{' '}
                <SupportLink
                  className={cn(InlineLinkClassName)}
                  queryParams={{ projectRef: slug, message: feedback }}
                >
                  open a support ticket
                </SupportLink>{' '}
                to get help, as we do not reply to all product feedback.
              </p>
            </Admonition>
          </motion.div>
        )}
      </AnimatePresence>

      <PopoverSeparator_Shadcn_ />

      <div className="px-4 pt-4 pb-4 flex flex-row items-center justify-between">
        <Button type="default" size="tiny" onClick={onSwitchToIssueOptions}>
          Get help instead
        </Button>
        <div className="flex items-center gap-2 flex-row">
          {!!screenshot ? (
            <div
              style={{ backgroundImage: `url("${screenshot}")` }}
              onClick={() => {
                const blob = convertB64toBlob(screenshot)
                const blobUrl = URL.createObjectURL(blob)
                window.open(blobUrl, '_blank')
              }}
              className="cursor-pointer rounded h-[26px] w-[26px] border border-control relative bg-cover bg-center bg-no-repeat"
            >
              <button
                className={[
                  'cursor-pointer rounded-full bg-red-900 h-3 w-3',
                  'flex items-center justify-center absolute -top-1 -right-1',
                ].join(' ')}
                onClick={(event) => {
                  event.stopPropagation()
                  setScreenshot(null)
                }}
              >
                <X size={8} strokeWidth={3} />
              </button>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="default"
                  disabled={isSavingScreenshot}
                  loading={isSavingScreenshot}
                  className="w-7"
                  icon={<ImageIcon size={14} />}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end" className="w-fit">
                <DropdownMenuItem
                  className="flex gap-2"
                  key="upload-screenshot"
                  onSelect={() => {
                    if (uploadButtonRef.current) (uploadButtonRef.current as any).click()
                  }}
                >
                  <Upload size={14} />
                  Upload screenshot
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex gap-2"
                  key="capture-screenshot"
                  onSelect={() => captureScreenshot()}
                >
                  <Camera size={14} />
                  Capture screenshot
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <input
            type="file"
            ref={uploadButtonRef}
            className="hidden"
            accept="image/png"
            onChange={onFilesUpload}
          />
          <Button
            disabled={feedback.length === 0 || isSending}
            loading={isSending}
            onClick={() => {
              sendFeedback()
              sendEvent({
                action: 'send_feedback_button_clicked',
                groups: { project: ref, organization: org?.slug },
              })
            }}
          >
            Send
          </Button>
        </div>
      </div>
    </>
  )
}
