import { useState, useEffect, useRef, FC } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Button, Input, Popover } from '@supabase/ui'

import { useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'

interface Props {
  onClose: () => void
}

const FeedbackWidget: FC<Props> = ({ onClose }) => {
  const router = useRouter()
  const { ref } = router.query

  const { ui } = useStore()
  const inputRef = useRef<any>(null)

  const [feedback, setFeedback] = useState('')
  const [isSending, setSending] = useState(false)

  useEffect(() => {
    inputRef?.current?.focus()
  }, [inputRef])

  function onFeedbackChange(e: any) {
    setFeedback(e.target.value)
  }

  function onCancel() {
    onClose()
  }

  const sendFeedback = async () => {
    if (feedback.length) {
      setSending(true)
      await post(`${API_URL}/feedback/send`, {
        message: feedback,
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
    <div className="">
      <Input.TextArea
        className="w-80 p-3"
        size="small"
        placeholder="Ideas on how to improve this page.&#10;Use the Support Form for technical issues."
        rows={5}
        value={feedback}
        onChange={onFeedbackChange}
      />
      <Popover.Seperator />
      <div className="w-80 space-y-3 px-3 py-2 pb-4">
        <div className="flex justify-between space-x-2">
          <Button type="default" onClick={onCancel} className="hover:border-gray-500">
            Cancel
          </Button>
          <Button disabled={isSending} loading={isSending} onClick={sendFeedback}>
            Send feedback
          </Button>
        </div>
        <p className="text-xs text-scale-1000">
          Have a technical issue? Contact{' '}
          <Link href="/support/new">
            <a>
              <span className="cursor-pointer transition-colors text-brand-900 hover:text-brand-1200">
                Supabase support
              </span>
            </a>
          </Link>{' '}
          or{' '}
          <a href="https://supabase.com/docs" target="_blank">
            <span className="cursor-pointer transition-colors text-brand-900 hover:text-brand-1200">
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
