import { useDebounce } from '@uidotdev/usehooks'
import { AnimatePresence, motion } from 'framer-motion'
import { CircleCheck } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { SupportLink } from 'components/interfaces/Support/SupportLink'
import { InlineLinkClassName } from 'components/ui/InlineLink'
import { useFeedbackCategoryQuery } from 'data/feedback/feedback-category'
import { useSendFeedbackMutation } from 'data/feedback/feedback-send'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useProfile } from 'lib/profile'
import { Button, cn, Dialog, DialogContent, DialogHeader, DialogTitle, TextArea_Shadcn_ } from 'ui'
import { Admonition } from 'ui-patterns'

interface FeedbackWidgetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const FeedbackWidget = ({ open, onOpenChange }: FeedbackWidgetProps) => {
  const router = useRouter()
  const { profile } = useProfile()
  const { ref, slug } = useParams()
  const { data: org } = useSelectedOrganizationQuery()

  const [feedback, setFeedback] = useState('')
  const [isSending, setSending] = useState(false)
  const [isFeedbackSent, setIsFeedbackSent] = useState(false)

  const debouncedFeedback = useDebounce(feedback, 500)

  const [storedFeedback, setStoredFeedback] = useLocalStorageQuery<string | null>(
    LOCAL_STORAGE_KEYS.FEEDBACK_WIDGET_CONTENT,
    null
  )
  const { isSuccess } = useLocalStorageQuery<string | null>(
    LOCAL_STORAGE_KEYS.FEEDBACK_WIDGET_CONTENT,
    null
  )[2]

  const { data: category } = useFeedbackCategoryQuery({ prompt: debouncedFeedback })

  const { mutate: sendEvent } = useSendEventMutation()
  const { mutate: submitFeedback } = useSendFeedbackMutation({
    onSuccess: () => {
      setIsFeedbackSent(true)
      setFeedback('')
      setSending(false)
    },
    onError: (error) => {
      toast.error(`Failed to submit feedback: ${error.message}`)
      setSending(false)
    },
  })

  const sendFeedback = async () => {
    if (feedback.length > 0) {
      setSending(true)
      submitFeedback({
        projectRef: ref,
        organizationSlug: slug,
        message: feedback,
        pathname: router.asPath,
      })
    }
  }

  useEffect(() => {
    if (storedFeedback) setFeedback(storedFeedback)
  }, [isSuccess, storedFeedback])

  useEffect(() => {
    if (debouncedFeedback.length > 0) setStoredFeedback(debouncedFeedback)
  }, [debouncedFeedback, setStoredFeedback])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 py-5">
        {isFeedbackSent ? (
          <ThanksMessage onClose={() => onOpenChange(false)} />
        ) : (
          <>
            <DialogHeader className="px-5">
              <DialogTitle>Share feedback</DialogTitle>
            </DialogHeader>
            <div className="px-5 pb-4">
              <TextArea_Shadcn_
                placeholder="My idea to improve Supabase is..."
                rows={5}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="text-sm mt-2 mb-1"
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
                      <SupportLink
                        className={cn(
                          InlineLinkClassName,
                          'text-foreground-light hover:text-foreground'
                        )}
                        queryParams={{ projectRef: slug, message: feedback }}
                      >
                        open a support ticket
                      </SupportLink>{' '}
                      to get help with this issue, as we do not reply to all product feedback.
                    </p>
                  </Admonition>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="px-5 flex flex-row justify-end items-start mt-4">
              <div className="flex items-center gap-2 flex-row">
                <Button type="default" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
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
        )}
      </DialogContent>
    </Dialog>
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
        <div className="flex items-center justify-between px-4">
          <p className="text-xs text-foreground-light">
            <SupportLink>
              <span className="cursor-pointer text-brand transition-colors hover:text-brand-600">
                Create a Support Ticket
              </span>
            </SupportLink>
          </p>

          <Button type="default" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
