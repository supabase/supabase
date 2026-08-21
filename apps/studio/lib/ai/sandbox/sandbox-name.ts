import { createHash } from 'node:crypto'

export function sandboxNameFor({ projectRef, chatId }: { projectRef: string; chatId: string }) {
  const digest = createHash('sha256').update(`${projectRef}:${chatId}`).digest('hex').slice(0, 32)
  return `studio-${digest}`
}
