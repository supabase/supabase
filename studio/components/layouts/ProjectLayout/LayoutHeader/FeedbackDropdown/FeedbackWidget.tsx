import { useParams } from 'common'
import { toPng } from 'html-to-image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconCamera,
  IconImage,
  IconUpload,
  IconX,
  Input,
} from 'ui'

import { useSendFeedbackMutation } from 'data/feedback/feedback-send'
import { useStore } from 'hooks'
import { timeout } from 'lib/helpers'
import { convertB64toBlob, uploadAttachment } from './FeedbackDropdown.utils'

interface FeedbackWidgetProps {
  onClose: () => void
  feedback: string
  setFeedback: (value: string) => void
  screenshot: string | undefined
  setScreenshot: (value: string | undefined) => void
}

const FeedbackWidget = ({
  onClose,
  feedback,
  setFeedback,
  screenshot,
  setScreenshot,
}: FeedbackWidgetProps) => {
  const router = useRouter()
  const { ref, slug } = useParams()

  const { ui } = useStore()
  const inputRef = useRef<any>(null)
  const uploadButtonRef = useRef()

  const [isSending, setSending] = useState(false)
  const [isSavingScreenshot, setIsSavingScreenshot] = useState(false)
  const { mutateAsync: submitFeedback } = useSendFeedbackMutation()

  useEffect(() => {
    inputRef?.current?.focus()
  }, [inputRef])

  function onFeedbackChange(e: any) {
    setFeedback(e.target.value)
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
      .then((dataUrl: any) => setScreenshot(dataUrl))
      .catch((error: any) => {
        ui.setNotification({
          error,
          category: 'error',
          message: 'Failed to capture screenshot',
          duration: 4000,
        })
      })
      .finally(() => {
        setIsSavingScreenshot(false)
      })
  }

  const onFilesUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    event.persist()
    const [file] = event.target.files || (event as any).dataTransfer.items

    const reader = new FileReader()
    reader.onload = function (event) {
      setScreenshot(event.target?.result as string)
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const sendFeedback = async () => {
    if (feedback.length === 0 && screenshot !== undefined) {
      return ui.setNotification({
        category: 'error',
        message: 'Please include a message in your feedback.',
        duration: 4000,
      })
    } else if (feedback.length > 0) {
      setSending(true)

      const attachmentUrl = screenshot
        ? await uploadAttachment(ref as string, screenshot)
        : undefined
      const formattedFeedback =
        attachmentUrl !== undefined ? `${feedback}\n\nAttachments:\n${attachmentUrl}` : feedback

      try {
        await submitFeedback({
          projectRef: ref,
          organizationSlug: slug,
          message: formattedFeedback,
          pathname: router.asPath,
        })
        setFeedback('')
        ui.setNotification({
          category: 'success',
          message:
            'Feedback sent. Thank you!\n\nPlease be aware that we do not provide responses to feedback. If you require assistance or a reply, consider submitting a support ticket.',
        })
      } finally {
        setSending(false)
      }
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
        onChange={onFeedbackChange}
      />
      <div className="w-full h-px bg-border" />
      <div className="w-80 space-y-3 px-3 py-2 pb-4">
        <div className="flex justify-between space-x-2">
          <Button type="default" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex items-center space-x-2">
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
                  <IconX size={8} strokeWidth={3} />
                </button>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button
                    asChild
                    type="default"
                    disabled={isSavingScreenshot}
                    loading={isSavingScreenshot}
                    className="px-2 py-1.5"
                    icon={<IconImage size={14} />}
                  >
                    <span></span>
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
                    <IconUpload size={14} />
                    Upload screenshot
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex gap-2"
                    key="capture-screenshot"
                    onSelect={() => captureScreenshot()}
                  >
                    <IconCamera size={14} />
                    Capture screenshot
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <input
              type="file"
              // @ts-ignore
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
