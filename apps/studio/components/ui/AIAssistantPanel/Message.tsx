import { motion } from 'framer-motion'
import { User } from 'lucide-react'
import { memo, PropsWithChildren, useEffect, useRef, useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { AiIconAnimation, cn, CodeBlock, markdownComponents, WarningIcon } from 'ui'
import CollapsibleCodeBlock from './CollapsibleCodeBlock'
import { SqlSnippet } from './SqlSnippet'
import { DebouncedComponent } from '../DebouncedComponent'

const MemoizedPreComponent = memo(
  function MemoizedPreComponent({
    props,
    readOnly,
    isLoading,
  }: {
    props: any
    readOnly?: boolean
    isLoading?: boolean
  }) {
    const language = props.children[0].props.className?.replace('language-', '') || 'sql'
    const codeContent = props.children[0].props.children

    const debouncedElement = useMemo(
      () => (
        <DebouncedComponent
          value={codeContent[0]}
          delay={500}
          fallback={
            <div className="overflow-hidden rounded border w-auto bg-surface-100 p-2 px-3">
              Writing SQL...
            </div>
          }
        >
          <SqlSnippet sql={codeContent} readOnly={readOnly} isLoading={isLoading} />
        </DebouncedComponent>
      ),
      [codeContent, readOnly, isLoading]
    )

    if (language === 'sql') {
      return readOnly ? (
        <CollapsibleCodeBlock
          value={props.children[0].props.children[0]}
          language="sql"
          hideLineNumbers
        />
      ) : (
        debouncedElement
      )
    }

    return (
      <CodeBlock
        hideLineNumbers
        value={props.children[0].props.children}
        language={language}
        className={cn(
          'max-h-96 max-w-none block border rounded !bg-transparent !py-3 !px-3.5 prose dark:prose-dark text-foreground',
          '[&>code]:m-0 [&>code>span]:flex [&>code>span]:flex-wrap [&>code]:block [&>code>span]:text-foreground'
        )}
      />
    )
  },
  (prevProps, nextProps) => {
    return (
      prevProps.props === nextProps.props &&
      prevProps.readOnly === nextProps.readOnly &&
      prevProps.isLoading === nextProps.isLoading
    )
  }
)
MemoizedPreComponent.displayName = 'MemoizedPreComponent'

const MemoizedMarkdown = memo(
  function MemoizedMarkdown({
    content,
    readOnly,
    isLoading,
  }: {
    content: string
    readOnly?: boolean
    isLoading?: boolean
  }) {
    const components = useMemo(
      () => ({
        ...markdownComponents,
        pre: (props: any) => <MemoizedPreComponent props={props} readOnly={readOnly} />,
        ol: (props: any) => <ol className="flex flex-col gap-y-4">{props.children}</ol>,
        li: (props: any) => <li className="[&>pre]:mt-2">{props.children}</li>,
        h3: (props: any) => <h3 className="underline">{props.children}</h3>,
        code: (props: any) => (
          <code className={cn('text-xs', props.className)}>{props.children}</code>
        ),
        a: (props: any) => (
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={props.href}
            className="underline transition underline-offset-2 decoration-foreground-lighter hover:decoration-foreground text-foreground"
          >
            {props.children}
          </a>
        ),
      }),
      []
    )

    return (
      <ReactMarkdown
        className="space-y-5 flex-1 [&>*>code]:text-xs [&>*>*>code]:text-xs min-w-0 [&_li]:space-y-4"
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    )
  },
  (prevProps, nextProps) => {
    return (
      prevProps.content === nextProps.content &&
      prevProps.readOnly === nextProps.readOnly &&
      prevProps.isLoading === nextProps.isLoading
    )
  }
)
MemoizedMarkdown.displayName = 'MemoizedMarkdown'

interface MessageProps {
  id: string
  role: 'function' | 'system' | 'user' | 'assistant' | 'data' | 'tool'
  content?: string
  isLoading: boolean
  readOnly?: boolean
  action?: React.ReactNode
  variant?: 'default' | 'warning'
}

export const Message = memo(
  function Message({
    role,
    content,
    isLoading,
    readOnly,
    children,
    action = null,
    variant = 'default',
  }: PropsWithChildren<MessageProps>) {
    if (!content) return null

    const isUser = role === 'user'

    return (
      <div
        className={cn(
          'mb-5 text-foreground-light text-sm',
          isUser && 'text-foreground',
          variant === 'warning' && 'bg-warning-200'
        )}
      >
        {children}
        {variant === 'warning' && <WarningIcon className="w-6 h-6" />}
        {action}

        <div className="flex gap-4 w-auto overflow-hidden">
          {isUser ? (
            <figure className="w-5 h-5 shrink-0 bg-foreground rounded-full flex items-center justify-center">
              <User size={16} strokeWidth={1.5} className="text-background" />
            </figure>
          ) : (
            <AiIconAnimation size={20} className="text-foreground-muted shrink-0" />
          )}
          <MemoizedMarkdown content={content} readOnly={readOnly} isLoading={isLoading} />
        </div>
      </div>
    )
  },
  (prevProps, nextProps) => {
    // Custom comparison function for memo
    return (
      prevProps.id === nextProps.id &&
      prevProps.role === nextProps.role &&
      prevProps.content === nextProps.content &&
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.readOnly === nextProps.readOnly &&
      prevProps.action === nextProps.action &&
      prevProps.variant === nextProps.variant &&
      prevProps.children === nextProps.children
    )
  }
)
Message.displayName = 'Message'
