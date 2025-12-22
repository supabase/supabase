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
}

export function RepliesList({ replies, questionAuthor }: RepliesListProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasMoreThanThree = replies.length > 3
  const displayedReplies = isExpanded ? replies : replies.slice(0, 3)

  if (replies.length === 0) {
    return null
  }

  return (
    <div className="grid gap-2">
      <h3 className="text-sm font-medium text-muted-foreground mb-2">
        {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
      </h3>
      <div className="relative">
        <div className="grid gap-3">
          {displayedReplies.map((reply, index) => {
            const timestamp = reply.ts ? new Date(reply.ts).toLocaleString() : null
            const isOP = reply.author === questionAuthor

            return (
              <div
                key={reply.id}
                className="border border-border rounded-lg p-4 bg-surface-75 min-w-0"
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

        {/* Stacked cards effect when collapsed */}
        {hasMoreThanThree && !isExpanded && (
          <div className="relative">
            <div className="absolute -bottom-1 left-2 right-2 h-3 border border-border border-t-0 rounded-b-lg bg-surface-75 opacity-60 -z-10" />
            <div className="absolute -bottom-2 left-4 right-4 h-3 border border-border border-t-0 rounded-b-lg bg-surface-75 opacity-30 -z-20" />
          </div>
        )}
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
