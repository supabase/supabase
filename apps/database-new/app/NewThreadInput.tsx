'use client'

import { AssistantChatForm } from '@/components/AssistantChatForm'
import { useAppStateSnapshot } from '@/lib/state'
import { createClient } from '@/lib/supabase/client'

const NewThreadInput = () => {
  const supabase = createClient()
  const snap = useAppStateSnapshot()

  return (
    <>
      <div className="relative w-10/12 xl:w-11/12 max-w-xl">
        <AssistantChatForm
          key={'new-thread-form'}
          chatContext={'new'}
          canSubmit={async () => {
            const {
              data: { user },
            } = await supabase.auth.getUser()
            if (!user) {
              snap.setLoginDialogOpen(true)
              return false
            }
            return true
          }}
          placeholder="e.g Create a Telegram-like chat application"
        />
      </div>
    </>
  )
}

export default NewThreadInput
