'use client'

import { AssistantWidget } from '@/registry/default/blocks/assistant/components/assistant-widget'
import { createClient } from '@/registry/default/blocks/assistant/lib/supabase/client'
import { useEffect } from 'react'

const AssistantDemoContent = () => (
  <div className="max-w-2xl mx-auto p-8">
    <p>
      Click the Assistant widget and ask it to create, read, update, or delete tasks in your
      database. Tasks will be scoped to your current session.
    </p>
  </div>
)

const AssistantDemo = () => {
  useEffect(() => {
    const ensureSession = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        const { error } = await supabase.auth.signInAnonymously()
        if (error) {
          console.error('Anonymous sign-in failed', error)
        }
      }
    }

    ensureSession().catch((error) => {
      console.error('Failed to check session', error)
    })
  }, [])

  return (
    <div className="relative h-screen w-screen flex flex-col items-center justify-center">
      <AssistantDemoContent />
      <AssistantWidget triggerClassName="absolute bottom-6 right-6" />
    </div>
  )
}

export default AssistantDemo
