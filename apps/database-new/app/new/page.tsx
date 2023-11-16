'use client'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

import { Input } from 'ui'

export default function NewThread() {
  const router = useRouter()

  const { mutate, isPending } = useMutation({
    mutationFn: async (prompt: string) => {
      const body = { prompt }
      const response = await fetch('/api/ai/sql/threads/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
    <main className="flex min-h-screen w-full flex-row items-center justify-center">
      <Input
        className="w-11/12 max-w-xl"
        inputClassName="rounded-full"
        placeholder="Ask for some changes..."
        size="xlarge"
        autoFocus
        disabled={isPending}
        onKeyDown={(e) => {
          if (e.code === 'Enter') {
            mutate((e.target as any).value)
          }
        }}
      />
    </main>
  )
}
