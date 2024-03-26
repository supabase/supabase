import dayjs from 'dayjs'
import { noop } from 'lodash'
import Image from 'next/image'
import { PropsWithChildren, memo, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AiIconAnimation, Badge, cn, markdownComponents } from 'ui'

import { useProfile } from 'lib/profile'
import { AIPolicyPre } from './AIPolicyPre'

interface MessageProps {
  name?: string
  role: 'function' | 'system' | 'user' | 'assistant' | 'data' | 'tool'
  content?: string
  createdAt?: number
  isDebug?: boolean
  isSelected?: boolean
  onDiff?: (s: string) => void
}

const Message = memo(function Message({
  name,
  role,
  content,
  createdAt,
  isDebug,
  isSelected,
  onDiff = noop,
  children,
}: PropsWithChildren<MessageProps>) {
  const { profile } = useProfile()

  const icon = useMemo(() => {
    return role === 'assistant' ? (
      <div
        className={cn(
          'bg-foreground border border-foreground-light rounded-full',
          'w-8 h-8',
          'flex items-center justify-center'
        )}
      >
        <AiIconAnimation
          loading={content === 'Thinking...'}
          className={cn('scale-75', '[&>div>div]:border-background')}
        />
      </div>
    ) : (
      <div className="relative border shadow-lg w-8 h-8 rounded-full overflow-hidden">
        {/* // TODO: this only works for GitHub profiles */}
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

  if (!content) return null

  return (
    <div className="flex flex-col py-4 gap-4 px-5 text-foreground-light text-sm">
      <div className="flex flex-row gap-3 items-center">
        {icon}
        <span className="text-foreground">
          {role === 'assistant' ? 'Assistant' : name ? name : 'You'}
        </span>
        {createdAt && (
          <span className="text-xs text-foreground-muted">{dayjs(createdAt).fromNow()}</span>
        )}
        {isDebug && <Badge variant="warning">Debug request</Badge>}
      </div>
      <ReactMarkdown
        className="gap-2.5 flex flex-col"
        remarkPlugins={[remarkGfm]}
        components={{
          ...markdownComponents,
          pre: (props: any) => {
            return (
              <AIPolicyPre
                onDiff={onDiff}
                className={cn(
                  'transition',
                  isSelected ? '[&>div>pre]:!border-stronger [&>div>pre]:!bg-surface-200' : ''
                )}
              >
                {props.children[0].props.children}
              </AIPolicyPre>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
      {children}
    </div>
  )
})

export default Message
