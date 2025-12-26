'use client'

import Link from 'next/link'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Badge, Button, Card, CardContent, CardFooter } from 'ui'
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
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-muted-foreground">
        {displayCount} {displayCount === 1 ? 'reply' : 'replies'}
      </h3>
      <Card className="relative">
        <CardContent className="flex flex-col p-0">
          {displayedReplies.map((reply, index) => {
            const timestamp = reply.ts ? new Date(reply.ts).toLocaleString() : null
            const isOP = reply.author === questionAuthor

            return (
              <div key={reply.id} className="border-b border-border last:border-b-0">
                <div className="px-6 py-6">
                  <div className="text-sm text-foreground mb-3 min-w-0">
                    <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
                      {reply.content || ''}
                    </ReactMarkdown>
                  </div>
                  <div className="flex items-center gap-x-1 text-xs text-foreground-lighter">
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
                    {reply.author && timestamp && <span>·</span>}
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
              </div>
            )
          })}
        </CardContent>
        {hasMoreThanThree && (
          <CardFooter className="flex justify-center">
            <Button
              type="default"
              size="tiny"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-min"
            >
              {isExpanded
                ? 'Show fewer replies'
                : `Show ${replies.length - 3} more ${replies.length - 3 === 1 ? 'reply' : 'replies'}`}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
