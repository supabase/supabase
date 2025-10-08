import { AnimatePresence, motion } from 'framer-motion'
import { toPng } from 'html-to-image'
import { Camera, CircleCheck, Image as ImageIcon, Upload, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useDebounce } from 'use-debounce'

import { useParams } from 'common'
import { InlineLink } from 'components/ui/InlineLink'
import { useFeedbackCategoryQuery } from 'data/feedback/feedback-category'
import { useSendFeedbackMutation } from 'data/feedback/feedback-send'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { DOCS_URL } from 'lib/constants'
import { timeout } from 'lib/helpers'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  PopoverSeparator_Shadcn_,
  TextArea_Shadcn_,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { convertB64toBlob, uploadAttachment } from './FeedbackDropdown.utils'

interface FeedbackWidgetProps {
  feedback: string
  screenshot: string | undefined
  onClose: () => void
  setFeedback: (value: string) => void
  setScreenshot: (value: string | undefined) => void
}

export const FeedbackWidget = ({
  feedback,
  screenshot,
  onClose,
  setFeedback,
  setScreenshot,
}: FeedbackWidgetProps) => {
  const FEEDBACK_STORAGE_KEY = 'feedback_content'
  const SCREENSHOT_STORAGE_KEY = 'screenshot'

  const router = useRouter()
  const { ref, slug } = useParams()
  const { data: org } = useSelectedOrganizationQuery()
  const uploadButtonRef = useRef(null)

  const [isSending, setSending] = useState(false)
  const [isSavingScreenshot, setIsSavingScreenshot] = useState(false)
  const [isFeedbackSent, setIsFeedbackSent] = useState(false)
  const [debouncedFeedback] = useDebounce(feedback, 450)

  const { data: category } = useFeedbackCategoryQuery({
    prompt: debouncedFeedback,
  })

  const { mutate: sendEvent } = useSendEventMutation()

  const { mutate: submitFeedback } = useSendFeedbackMutation({
    onSuccess: () => {
      setIsFeedbackSent(true)
      setFeedback('')
      setScreenshot(undefined)
      localStorage.removeItem(FEEDBACK_STORAGE_KEY)
      localStorage.removeItem(SCREENSHOT_STORAGE_KEY)

      setSending(false)
    },
    onError: (error) => {
      toast.error(`Failed to submit feedback: ${error.message}`)
      setSending(false)
    },
  })

  useEffect(() => {
    const storedFeedback = localStorage.getItem(FEEDBACK_STORAGE_KEY)
    if (storedFeedback) {
      setFeedback(storedFeedback)
    }

    const storedScreenshot = localStorage.getItem(SCREENSHOT_STORAGE_KEY)
    if (storedScreenshot) {
      setScreenshot(storedScreenshot)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(FEEDBACK_STORAGE_KEY, feedback)
  }, [feedback])

  useEffect(() => {
    if (screenshot) {
      localStorage.setItem(SCREENSHOT_STORAGE_KEY, screenshot)
    }
  }, [screenshot])

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
      .then((dataUrl: any) => {
        localStorage.setItem(SCREENSHOT_STORAGE_KEY, dataUrl)
        setScreenshot(dataUrl)
      })
      .catch(() => toast.error('Failed to capture screenshot'))
      .finally(() => {
        setIsSavingScreenshot(false)
      })
  }

  const onFilesUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    event.persist()
    const [file] = event.target.files || (event as any).dataTransfer.items

    const reader = new FileReader()
    reader.onload = function (event) {
      const dataUrl = event.target?.result
      if (typeof dataUrl === 'string') {
        setScreenshot(dataUrl)
        localStorage.setItem(SCREENSHOT_STORAGE_KEY, dataUrl)
      }
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
        if (typeof dataUrl === 'string') {
          setScreenshot(dataUrl)
          localStorage.setItem(SCREENSHOT_STORAGE_KEY, dataUrl)
        }
      }
      reader.readAsDataURL(blob)
    }
  }

  const sendFeedback = async () => {
    if (feedback.length === 0 && screenshot !== undefined) {
      return toast.error('Please include a message in your feedback.')
    } else if (feedback.length > 0) {
      setSending(true)

      const attachmentUrl = screenshot
        ? await uploadAttachment(ref as string, screenshot)
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

  return isFeedbackSent ? (
    <ThanksMessage onClose={onClose} />
  ) : (
    <>
      <div>
        <div className="px-5 pb-4">
          <TextArea_Shadcn_
            placeholder="It would be great if..."
            rows={5}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            onPaste={handlePasteEvent}
            className="text-sm mt-4 mb-1"
          />
        </div>

        <AnimatePresence>
          {category === 'support' && (
            <motion.div
              key="support-alert"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.25 }}
            >
              <Admonition
                type="caution"
                title="This looks like an issue that's better handled by support"
                className="rounded-none border-x-0 border-b-0 mb-0 [&>h5]:text-xs [&>h5]:mb-0.5"
              >
                <p className="text-xs text-foreground-light !leading-tight">
                  Please{' '}
                  <InlineLink
                    className="text-foreground-light hover:text-foreground"
                    href={`/support/new/?projectRef=${slug}&message=${encodeURIComponent(feedback)}`}
                  >
                    open a support ticket
                  </InlineLink>{' '}
                  to get help with this issue, as we do not reply to all product feedback.
                </p>
              </Admonition>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PopoverSeparator_Shadcn_ />

      <div className="px-5 flex flex-row justify-between items-start mt-4">
        <div>
          <p className="text-xs text-foreground">Have a technical issue?</p>
          <p className="text-xs text-foreground-light">
            Contact{' '}
            <Link href="/support/new">
              <span className="cursor-pointer text-brand transition-colors hover:text-brand-600">
                support
              </span>
            </Link>{' '}
            or{' '}
            <a href={`${DOCS_URL}`} target="_blank" rel="noreferrer">
              <span className="cursor-pointer text-brand transition-colors hover:text-brand-600">
                see docs
              </span>
            </a>
            .
          </p>
        </div>
        <div className="flex items-center gap-2 flex-row">
          {screenshot !== undefined ? (
            <div
              style={{ backgroundImage: `url("${screenshot}")` }}
              onClick={() => {
                const blob = convertB64toBlob(screenshot)
                const blobUrl = URL.createObjectURL(blob)
                window.open(blobUrl, '_blank')
              }}
              className="cursor-pointer rounded h-[26px] w-[30px] border border-control relative bg-cover bg-center bg-no-repeat"
            >
              <button
                className={[
                  'cursor-pointer rounded-full bg-red-900 h-3 w-3',
                  'flex items-center justify-center absolute -top-1 -right-1',
                ].join(' ')}
                onClick={(event) => {
                  event.stopPropagation()
                  setScreenshot(undefined)
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
                  className="px-2"
                >
                  <ImageIcon size={14} />
                </Button>
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

const ThanksMessage = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="px-0 pt-3 pb-0">
      <div className="grid gap-3">
        <div className="px-6 grid gap-3 py-2 text-center text-foreground-light">
          <CircleCheck className="mx-auto text-brand-500" size={24} />
          <p className="text-foreground text-base">Your feedback has been sent. Thanks!</p>
          <p className="text-sm ">
            We do not always respond to feedback. If you require assistance, please contact support
            instead.
          </p>
        </div>
        <PopoverSeparator_Shadcn_ />
        <div className="flex items-center justify-between px-4">
          <p className="text-xs text-foreground-light">
            <Link href="/support/new">
              <span className="cursor-pointer text-brand transition-colors hover:text-brand-600">
                Create a Support Ticket
              </span>
            </Link>
          </p>

          <Button type="default" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
