'use client'

import { updateThreadVisibility } from '@/app/actions'
import { createRef, useEffect, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'

import { ThreadViewType } from './Threads'

import {
  Button,
  DialogContent_Shadcn_,
  DialogDescription_Shadcn_,
  DialogFooter_Shadcn_,
  DialogHeader_Shadcn_,
  DialogTitle_Shadcn_,
  Dialog_Shadcn_,
  RadioGroupItem_Shadcn_,
  RadioGroup_Shadcn_,
} from 'ui'
import { Lock, Unlock } from 'lucide-react'

const ThreadPrivacyModal = ({
  thread,
  onClose,
  visible,
}: {
  thread: ThreadViewType
  onClose: () => void
  visible: boolean
}) => {
  const formRef = createRef<HTMLFormElement>()

  const initialState = {
    message: undefined,
    success: undefined,
    data: {
      thread_id: thread.thread_id,
      is_public: thread.is_public,
    },
  }

  const [state, formAction] = useFormState(updateThreadVisibility, initialState)
  const [threadIsPublic, setThreadIsPublic] = useState(thread.is_public)

  useEffect(() => {
    if (state?.success === true) {
      onClose()
      formRef.current?.reset()
      state.success = undefined
    }
  }, [state, onClose, formRef])

  function SubmitButton() {
    const { pending } = useFormStatus()

    return (
      <Button type="primary" htmlType="submit" aria-disabled={pending} loading={pending}>
        Confirm
      </Button>
    )
  }

  return (
    <Dialog_Shadcn_ open={visible} onOpenChange={onClose}>
      <DialogContent_Shadcn_>
        <DialogHeader_Shadcn_>
          <DialogTitle_Shadcn_>Change thread visibility</DialogTitle_Shadcn_>
          <DialogDescription_Shadcn_ className="text-foreground">
            Threads are public by default, but you can choose to make them private.
          </DialogDescription_Shadcn_>
        </DialogHeader_Shadcn_>
        <div className="px-7">
          <form action={formAction} className=" space-y-6">
            <input
              type="hidden"
              name="thread_visibility"
              value={threadIsPublic ? 'public' : 'private'}
            />
            <input type="hidden" name="thread_id" value={thread.thread_id || ''} />
            <RadioGroup_Shadcn_
              value={threadIsPublic ? 'public' : 'private'}
              defaultValue={threadIsPublic ? 'public' : 'private'}
              onValueChange={() => setThreadIsPublic(!threadIsPublic)}
            >
              <div className="grid gap-8 items-center space-x-2">
                <div className="flex gap-4">
                  <RadioGroupItem_Shadcn_ value="public" id="public" />
                  <label htmlFor="public">
                    <div className="border-b -mt-3 pb-4">
                      <div className="font-bold">
                        <div className="flex items-center gap-2 ">
                          <Unlock size={15} />
                          Public
                        </div>
                      </div>

                      <p className="text-sm">
                        Anyone with a link can see this thread. It may appear in any galleries on
                        this site.
                      </p>
                    </div>
                  </label>
                </div>
                <div className="flex gap-4">
                  <RadioGroupItem_Shadcn_ value="private" id="private" />
                  <label htmlFor="private">
                    <div className="-mt-3">
                      <div className="font-bold">
                        <div className="flex items-center gap-2 ">
                          <Lock size={15} />
                          Private
                        </div>
                      </div>

                      <p className="text-sm">Only you can see this thread.</p>
                    </div>
                  </label>
                </div>
              </div>
            </RadioGroup_Shadcn_>

            <DialogFooter_Shadcn_>
              <Button type="default" onClick={onClose}>
                Cancel
              </Button>
              <SubmitButton />
            </DialogFooter_Shadcn_>
          </form>
        </div>
      </DialogContent_Shadcn_>
    </Dialog_Shadcn_>
  )
}

export default ThreadPrivacyModal
