import { toPng } from 'html-to-image'
import { Camera, Image as ImageIcon, Upload, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
} from 'ui'

import { useParams } from 'common'
import { useSendFeedbackMutation } from 'data/feedback/feedback-send'
import { timeout } from 'lib/helpers'
import { convertB64toBlob, uploadAttachment } from './FeedbackDropdown.utils'

interface FeedbackWidgetProps {
  feedback: string
  screenshot: string | undefined
  onClose: () => void
  setFeedback: (value: string) => void
  setScreenshot: (value: string | undefined) => void
}

const FeedbackWidget = ({
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
  const uploadButtonRef = useRef(null)

  const [isSending, setSending] = useState(false)
  const [isSavingScreenshot, setIsSavingScreenshot] = useState(false)

  const { mutate: submitFeedback } = useSendFeedbackMutation({
    onSuccess: () => {
      setFeedback('')
      setScreenshot(undefined)
      localStorage.removeItem(FEEDBACK_STORAGE_KEY)
      localStorage.removeItem(SCREENSHOT_STORAGE_KEY)
      toast.success(
        'Feedback sent. Thank you!\n\nPlease be aware that we do not provide responses to feedback. If you require assistance or a reply, consider submitting a support ticket.',
        { duration: 8000 }
      )
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

  const clearFeedback = () => {
    setFeedback('')
    setScreenshot(undefined)
    localStorage.removeItem(FEEDBACK_STORAGE_KEY)
    localStorage.removeItem(SCREENSHOT_STORAGE_KEY)
  }

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

    return onClose()
  }

  return (
    <div id="feedback-widget" className="text-area-text-sm">
      <Input.TextArea
        className="w-80 p-3"
        size="small"
        placeholder="Ideas on how to improve this page.&#10;Use the Support Form for technical issues."
        rows={5}
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        onPaste={handlePasteEvent}
      />
      <div className="w-full h-px bg-border" />
      <div className="w-80 space-y-3 px-3 py-2 pb-4">
        <div className="flex justify-between space-x-2">
          <Button
            type="default"
            onClick={() => {
              clearFeedback()
              onClose()
            }}
          >
            Cancel
          </Button>
          <div className="flex items-center space-x-2">
            <Button type="default" onClick={clearFeedback}>
              Clear
            </Button>
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
                    className="px-2 py-1.5"
                  >
                    <ImageIcon size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="end">
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
            <Button disabled={isSending} loading={isSending} onClick={sendFeedback}>
              Send feedback
            </Button>
          </div>
        </div>
        <p className="text-xs text-foreground-light">
          Have a technical issue? Contact{' '}
          <Link href="/support/new">
            <span className="cursor-pointer text-brand transition-colors hover:text-brand-600">
              Supabase support
            </span>
          </Link>{' '}
          or{' '}
          <a href="https://supabase.com/docs" target="_blank" rel="noreferrer">
            <span className="cursor-pointer text-brand transition-colors hover:text-brand-600">
              browse our docs
            </span>
          </a>
          .
        </p>
      </div>
    </div>
  )
}

export default FeedbackWidget
