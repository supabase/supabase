'use client'

import { useState } from 'react'
import { Badge, Button } from 'ui'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Link from 'next/link'
import { markdownComponents } from './markdownComponents'

interface Reply {
  id: string
  content: string | null
  author: string | null
  ts: string | null
  external_activity_url: string | null
}

interface RepliesListProps {
  replies: Reply[]
  questionAuthor: string | null
  totalReplyCount?: number
}

export function RepliesList({ replies, questionAuthor, totalReplyCount }: RepliesListProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasMoreThanThree = replies.length > 3
  const displayedReplies = isExpanded ? replies : replies.slice(0, 3)

  if (replies.length === 0) {
    return null
  }

  const displayCount = totalReplyCount || replies.length

  return (
    <div className="grid gap-2">
      <h3 className="text-sm font-medium text-muted-foreground mb-2">
        {displayCount} {displayCount === 1 ? 'Reply' : 'Replies'}
      </h3>
      <div className="relative">
        <div className="grid gap-4">
          {displayedReplies.map((reply, index) => {
            const timestamp = reply.ts ? new Date(reply.ts).toLocaleString() : null
            const isOP = reply.author === questionAuthor

            return (
              <div
                key={reply.id}
                className="min-w-0 border border-border rounded-lg bg-surface-100 p-4"
              >
                <div className="text-foreground mb-3 min-w-0">
                  <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
                    {reply.content || ''}
                  </ReactMarkdown>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {reply.author && (
                    <>
                      {isOP && <Badge variant="success">OP</Badge>}
                      <Link
                        href={`/contribute/u/${encodeURIComponent(reply.author)}`}
                        className="hover:text-foreground transition-colors"
                      >
                        {reply.author}
                      </Link>
                    </>
                  )}
                  {reply.author && timestamp && <span>•</span>}
                  {timestamp && reply.external_activity_url ? (
                    <a
                      href={reply.external_activity_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground transition-colors"
                    >
                      {timestamp}
                    </a>
                  ) : (
                    timestamp && <span>{timestamp}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {hasMoreThanThree && (
        <Button
          type="default"
          size="small"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2"
        >
          {isExpanded
            ? 'Show Less'
            : `Show ${replies.length - 3} More ${replies.length - 3 === 1 ? 'Reply' : 'Replies'}`}
        </Button>
      )}
    </div>
  )
}
