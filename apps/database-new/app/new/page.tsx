'use client'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Input } from 'ui'

export default function NewThread() {
  const router = useRouter()

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: async (prompt: string) => {
      const body = { prompt }
      const response = await fetch('/api/ai/sql/threads/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = await response.json()
      return result
    },
    onSuccess(data) {
      const url = `/${data.threadId}/${data.runId}`
      router.push(url)
    },
  })

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center gap-y-4">
      <div className="flex items-center gap-x-1.5 font-mono text-xl">
        <span>database</span>
        <div className="w-1.5 h-1.5 rounded-full bg-purple-900"></div>
        <span>new</span>
      </div>
      <Input
        autoFocus
        size="xlarge"
        className="w-11/12 max-w-xl shadow"
        inputClassName="rounded-full"
        placeholder="e.g Create a Telegram-like chat application"
        disabled={isPending || isSuccess}
        onKeyDown={(e) => {
          if (e.code === 'Enter') {
            console.log('Submit')
            const value = (e.target as any).value
            if (value.length > 0) mutate(value)
          }
        }}
        actions={
          isPending || isSuccess ? (
            <div className="mr-3">
              <Loader2 size={18} className="animate-spin" />
            </div>
          ) : null
        }
      />
    </main>
  )
}
