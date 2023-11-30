import { Message } from 'ai/react'
import { uuidv4 } from 'lib/helpers'

export type MessageWithDebug = Message & { isDebug: boolean }

export const generateThreadMessage = ({
  id,
  content,
  isDebug,
}: {
  id?: string
  content: string
  isDebug: boolean
}) => {
  const message: Message & { isDebug: boolean } = {
    id: id ?? uuidv4(),
    role: 'assistant',
    content,
    createdAt: new Date(),
    isDebug: isDebug,
  }
  return message
}
