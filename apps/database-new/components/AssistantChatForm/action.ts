'use server'

import { upsertThreadMessage } from '@/app/actions'

export async function upsertMessageFormAction(formData: FormData) {
  const threadId = formData.get('threadId') as string | undefined
  const prompt = formData.get('prompt') as string

  return upsertThreadMessage(prompt, threadId)
}
