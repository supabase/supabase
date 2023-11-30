import dayjs from 'dayjs'
import { noop } from 'lodash'
import Image from 'next/image'
import { memo, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { AiIconAnimation, Badge } from 'ui'

import { useProfile } from 'lib/profile'
import { Pre } from './Pre'

const Message = memo(function Message({
  id,
  name,
  role,
  content,
  createdAt,
  isDebug,
  isLoading,
  onDiff = noop,
}: {
  id: string
  name?: string
  role: 'function' | 'user' | 'assistant' | 'system'
  content?: string
  createdAt?: number
  isDebug?: boolean
  isLoading?: boolean
  onDiff?: (s: string) => void
}) {
  const { profile } = useProfile()

  const icon = useMemo(() => {
    return role === 'assistant' ? (
      <AiIconAnimation
        loading={content === 'Thinking...'}
        className="[&>div>div]:border-black dark:[&>div>div]:border-white"
      />
    ) : (
      <div className="relative border shadow-lg w-8 h-8 rounded-full overflow-hidden">
        <Image
          src={`https://github.com/${profile?.username}.png` || ''}
          width={30}
          height={30}
          alt="avatar"
          className="relative"
        />
      </div>
    )
  }, [content, profile?.username, role])

  const PreRenderer = useMemo(() => {
    const component = ({ children }: { children: React.ReactNode[] }) => {
      const code = (children[0] as any).props.children[0] as string
      if (code.length > 0) {
        return <Pre id={id} isLoading={isLoading || false} onDiff={onDiff} code={code} />
      }
      return null
    }
    return component
  }, [id, isLoading, onDiff])

  if (!content) return null

  return (
    <div className="flex flex-col py-4 gap-4 border-t px-5">
      <div className="flex flex-row gap-3 items-center">
        {icon}
        <span className="text-sm">{role === 'assistant' ? 'Assistant' : name ? name : 'You'}</span>
        {createdAt && (
          <span className="text-xs text-foreground-muted">{dayjs(createdAt).fromNow()}</span>
        )}
        {isDebug && <Badge color="amber">Debug request</Badge>}
      </div>
      <ReactMarkdown
        key={id}
        className="gap-2.5 flex flex-col"
        components={{
          p: ({ children }) => <div className="text-foreground-light text-sm">{children}</div>,
          // intentionally rendering as pre. The other approach would be to render as code element,
          // but that will render <code> elements which appear in the explanations as Monaco editors.
          pre: PreRenderer,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
})

export default Message
