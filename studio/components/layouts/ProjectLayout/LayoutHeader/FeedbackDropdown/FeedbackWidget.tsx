import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Button, Typography, Divider } from '@supabase/ui'

import { useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'

const FeedbackWidget = ({ onClose, feedback, setFeedback, category, setCategory }: any) => {
  const router = useRouter()
  const { ref } = router.query

  const { ui } = useStore()
  const inputRef = useRef<any>(null)

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
    <div className="absolute origin-top-right right-0 mt-1 w-80 rounded-md shadow-lg z-50">
      <div className="rounded-md border dark:border-dark bg-bg-primary-light dark:bg-bg-alt-dark">
        <div className="p-3">
          <textarea
            placeholder="Ideas on how to improve this page.&#10;Use the Support Form for technical issues."
            rows={4}
            ref={inputRef}
            value={feedback}
            className="mb-0"
            onChange={onFeedbackChange}
          />
        </div>
        <Divider />
        <div className="p-3 space-y-4 bg-bg-alt-light dark:bg-bg-alt-dark">
          <div className="flex justify-between space-x-2">
            <Button type="secondary" onClick={onCancel} className="hover:border-gray-500">
              Cancel
            </Button>
            <Button disabled={isSending} loading={isSending} onClick={sendFeedback}>
              Send feedback
            </Button>
          </div>
          <div>
            <Typography.Text small type="secondary">
              <p>
                Have a technical issue? Contact{' '}
                <Link href="/support/new">
                  <span className="cursor-pointer transition-colors text-green-600 hover:text-green-700">
                    Supabase Support
                  </span>
                </Link>{' '}
                or{' '}
                <a href="https://supabase.com/docs" target="_blank">
                  <span className="cursor-pointer transition-colors text-green-600 hover:text-green-700">
                    browse our docs
                  </span>
                </a>
                .
              </p>
            </Typography.Text>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeedbackWidget
