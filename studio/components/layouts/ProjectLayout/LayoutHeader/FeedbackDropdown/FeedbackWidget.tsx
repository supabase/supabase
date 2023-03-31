import Link from 'next/link'
import { useState, useEffect, useRef, FC, ChangeEvent } from 'react'
import { useRouter } from 'next/router'
import { toPng } from 'html-to-image'
import { Button, Input, Popover, IconCamera, IconX, IconImage, Dropdown, IconUpload } from 'ui'

import { useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { convertB64toBlob, uploadAttachment } from './FeedbackDropdown.utils'
import { timeout } from 'lib/helpers'

interface Props {
  onClose: () => void
  feedback: string
  setFeedback: (value: string) => void
  screenshot: string | undefined
  setScreenshot: (value: string | undefined) => void
}

const FeedbackWidget: FC<Props> = ({
  onClose,
  feedback,
  setFeedback,
  screenshot,
  setScreenshot,
}) => {
  const router = useRouter()
  const { ref } = router.query

  const { ui } = useStore()
  const inputRef = useRef<any>(null)
  const uploadButtonRef = useRef()

  const [isSending, setSending] = useState(false)
  const [isSavingScreenshot, setIsSavingScreenshot] = useState(false)

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
      await post(`${API_URL}/feedback/send`, {
        message: formattedFeedback,
        pathname: router.asPath,
        category: 'Feedback',
        projectRef: ref,
        tags: ['dashboard-feedback'],
      })
      setSending(false)
      setFeedback('')
      ui.setNotification({ category: 'success', message: 'Feedback sent. Thank you!' })
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
      <Popover.Separator />
      <div className="w-80 space-y-3 px-3 py-2 pb-4">
        <div className="flex justify-between space-x-2">
          <Button type="default" onClick={onClose} className="hover:border-gray-500">
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
                className="cursor-pointer rounded h-[26px] w-[30px] border border-scale-600 relative bg-cover bg-center bg-no-repeat"
              >
                <div
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
                </div>
              </div>
            ) : (
              <Dropdown
                className="feedback-dropdown"
                size="small"
                overlay={[
                  <Dropdown.Item
                    icon={<IconUpload size={14} />}
                    onClick={() => {
                      if (uploadButtonRef.current) (uploadButtonRef.current as any).click()
                    }}
                  >
                    Upload screenshot
                  </Dropdown.Item>,
                  <Dropdown.Item
                    icon={<IconCamera size={14} />}
                    onClick={() => captureScreenshot()}
                  >
                    Capture screenshot
                  </Dropdown.Item>,
                ]}
              >
                <Button
                  as="span"
                  type="default"
                  disabled={isSavingScreenshot}
                  loading={isSavingScreenshot}
                  className="px-2 py-1.5"
                  icon={<IconImage size={14} />}
                />
              </Dropdown>
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
        <p className="text-xs text-scale-1000">
          Have a technical issue? Contact{' '}
          <Link href="/support/new">
            <a>
              <span className="cursor-pointer text-brand-900 transition-colors hover:text-brand-1200">
                Supabase support
              </span>
            </a>
          </Link>{' '}
          or{' '}
          <a href="https://supabase.com/docs" target="_blank">
            <span className="cursor-pointer text-brand-900 transition-colors hover:text-brand-1200">
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
