import Link from 'next/link'
import { useState, useEffect, useRef, FC } from 'react'
import { useRouter } from 'next/router'
import * as Tooltip from '@radix-ui/react-tooltip'
import { toPng } from 'html-to-image'
import { Button, Input, Popover, IconCamera, IconX } from 'ui'

import { useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { convertB64toBlob, uploadAttachment } from './FeedbackDropdown.utils'

interface Props {
  onClose: () => void
}

const FeedbackWidget: FC<Props> = ({ onClose }) => {
  const router = useRouter()
  const { ref } = router.query

  const { ui } = useStore()
  const inputRef = useRef<any>(null)

  const [feedback, setFeedback] = useState('')
  const [screenshot, setScreenshot] = useState<string>()

  const [isSending, setSending] = useState(false)
  const [isSavingScreenshot, setIsSavingScreenshot] = useState(false)

  useEffect(() => {
    inputRef?.current?.focus()
  }, [inputRef])

  function onFeedbackChange(e: any) {
    setFeedback(e.target.value)
  }

  const captureScreenshot = () => {
    setIsSavingScreenshot(true)

    function filter(node: HTMLElement) {
      if ((node?.children ?? []).length > 0) {
        return node.children[0].id !== 'feedback-widget'
      }
      return true
    }

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
    <div id="feedback-widget">
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
              <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger>
                  <Button
                    as="span"
                    type="default"
                    disabled={isSavingScreenshot}
                    loading={isSavingScreenshot}
                    className="px-2 py-1.5"
                    icon={<IconCamera size={14} />}
                    onClick={() => captureScreenshot()}
                  />
                </Tooltip.Trigger>
                <Tooltip.Content side="bottom">
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                  <div
                    className={[
                      'bg-scale-100 rounded py-1 px-2 leading-none shadow', // background
                      'w-[130px] text-center border-scale-200 border', //border
                    ].join(' ')}
                  >
                    <span className="text-scale-1200 text-xs">
                      Capture screenshot of current view
                    </span>
                  </div>
                </Tooltip.Content>
              </Tooltip.Root>
            )}
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
