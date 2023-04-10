import { useCallback, useEffect, useState } from 'react'
import { format } from 'sql-formatter'
import {
  Button,
  CodeBlock,
  IconAlertTriangle,
  IconCheck,
  IconClipboard,
  IconCornerDownLeft,
  IconSave,
  IconUser,
  Input,
  MessageRole,
  MessageStatus,
  useAiChat,
} from 'ui'

import CopyToClipboard from 'react-copy-to-clipboard'
import { cn } from './../../utils/cn'
import { SAMPLE_QUERIES } from './Command.constants'
import { AiIcon, AiIconChat } from './Command.icons'
import { CommandItem } from './Command.utils'
import { useCommandMenu } from './CommandMenuProvider'
import { stripIndent } from 'common-tags'

const SQLOutputActions = ({ answer }: { answer: string }) => {
  const [showCopied, setShowCopied] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const { project, onSaveGeneratedSQL } = useCommandMenu()

  const applyCallback = () =>
    onSaveGeneratedSQL !== undefined
      ? new Promise((resolve) => onSaveGeneratedSQL(answer, resolve))
      : {}

  const onSelectSaveSnippet = async () => {
    setIsSaving(true)
    await applyCallback()
    setIsSaved(true)
    setIsSaving(false)
  }

  useEffect(() => {
    if (!showCopied) return
    const timer = setTimeout(() => setShowCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [showCopied])

  useEffect(() => {
    if (!isSaved) return
    const timer = setTimeout(() => setIsSaved(false), 2000)
    return () => clearTimeout(timer)
  }, [isSaved])

  return (
    <div className="flex items-center justify-end space-x-2">
      <CopyToClipboard text={answer?.replace(/```.*/g, '').trim()}>
        <Button
          type="default"
          icon={
            showCopied ? (
              <IconCheck size="tiny" className="text-brand-900" strokeWidth={2} />
            ) : (
              <IconClipboard size="tiny" />
            )
          }
          onClick={() => setShowCopied(true)}
        >
          {showCopied ? 'Copied' : 'Copy SQL'}
        </Button>
      </CopyToClipboard>
      {project?.ref !== undefined && onSaveGeneratedSQL !== undefined && (
        <Button
          type="default"
          loading={isSaving}
          disabled={isSaving}
          icon={
            isSaved ? (
              <IconCheck size="tiny" className="text-brand-900" strokeWidth={2} />
            ) : (
              <IconSave size="tiny" />
            )
          }
          onClick={() => onSelectSaveSnippet()}
        >
          {isSaved ? 'Snippet saved!' : 'Save into new snippet'}
        </Button>
      )}
    </div>
  )
}

const GenerateSQL = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>(SAMPLE_QUERIES[0].category)

  const { isLoading, setIsLoading, search, setSearch } = useCommandMenu()

  const { submit, reset, messages, isResponding, hasError } = useAiChat({
    messageTemplate: (message) =>
      stripIndent`
        Generate a Postgres SQL query based on the following natural language prompt.
        - Only output valid SQL - all explanations must be SQL comments
        - SQL comments should be short
        - Your very last output should be "\`\`\`"
        - For primary keys, always use "integer primary key generated always as identity"

        Natural language prompt:
        ${message}

        Postgres SQL query (markdown SQL only):
      `,
    setIsLoading,
  })

  const handleSubmit = useCallback(
    (message: string) => {
      setSearch('')
      submit(message)
    },
    [submit]
  )

  const handleReset = useCallback(() => {
    setSearch('')
    reset()
  }, [reset])

  useEffect(() => {
    if (search) {
      handleSubmit(search)
    }
  }, [])

  const formatAnswer = (answer: string) => {
    try {
      return format(answer, {
        language: 'postgresql',
        keywordCase: 'lower',
      })
    } catch (error: any) {
      return answer
    }
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <div className={cn('relative mb-[62px] py-4 max-h-[720px] overflow-auto')}>
        {messages.map((message) => {
          switch (message.role) {
            case MessageRole.User:
              return (
                <div className="flex gap-6 mx-4 [overflow-anchor:none] mb-6">
                  <div
                    className="
                      w-7 h-7 bg-scale-200 rounded-full border border-scale-400 flex items-center justify-center text-scale-1000 first-letter:
                      ring-scale-200 ring-1 shadow-sm
                    "
                  >
                    <IconUser strokeWidth={1.5} size={16} />
                  </div>
                  <div className="prose text-scale-1000">{message.content}</div>
                </div>
              )
            case MessageRole.Assistant:
              const answer = formatAnswer(
                message.content
                  .replace(/```sql/g, '')
                  .replace(/```.*/gs, '')
                  .replace(/-- End of SQL query\.*/g, '')
                  .trim()
              )

              const cantHelp = answer === "Sorry, I don't know how to help with that."

              return (
                <div className="px-4 [overflow-anchor:none] mb-6">
                  <div className="flex gap-6 [overflow-anchor:none] mb-6">
                    <div>
                      <AiIconChat />
                    </div>
                    <>
                      {message.status === MessageStatus.Pending ? (
                        <div className="bg-scale-700 h-[21px] w-[13px] mt-1 animate-bounce"></div>
                      ) : cantHelp ? (
                        <div className="p-6 flex flex-col flex-grow items-center gap-6 mt-4">
                          <IconAlertTriangle
                            className="text-amber-900"
                            strokeWidth={1.5}
                            size={21}
                          />
                          <p className="text-lg text-scale-1200 text-center">
                            Sorry, I don't know how to help with that.
                          </p>
                          <Button size="tiny" type="secondary" onClick={handleReset}>
                            Try again?
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2 flex-grow max-w-[93%]">
                          <CodeBlock
                            hideCopy
                            language="sql"
                            className="relative prose dark:prose-dark bg-scale-300 max-w-none"
                          >
                            {answer}
                          </CodeBlock>
                          {!isResponding && <SQLOutputActions answer={answer} />}
                        </div>
                      )}
                    </>
                  </div>
                </div>
              )
          }
        })}
        {messages.length === 0 && !hasError && (
          <div>
            <div className="px-10">
              <h3>Example queries</h3>
              <p className="text-sm mt-1 text-scale-1100">
                Use these example queries to help get your project started quickly.
              </p>
            </div>
            <div className="flex mt-4 border-t pt-2">
              <div className="w-1/3 py-4 px-6">
                <ul className="space-y-2">
                  {SAMPLE_QUERIES.map((item, index) => (
                    <li
                      key={index}
                      onClick={() => setSelectedCategory(item.category)}
                      className={cn(
                        'px-4 py-1 cursor-pointer text-sm hover:bg-slate-300 rounded-md',
                        selectedCategory === item.category && 'bg-slate-400 '
                      )}
                    >
                      {item.category}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="w-2/3 py-4 px-6">
                <ul>
                  {SAMPLE_QUERIES.find((item) => item.category === selectedCategory)?.queries.map(
                    (query, index) => (
                      <CommandItem
                        type="command"
                        onSelect={() => {
                          if (!search) {
                            handleSubmit(query)
                          }
                        }}
                        forceMount
                        key={query.replace(/\s+/g, '_')}
                      >
                        <div className="flex">
                          <div>
                            <AiIcon />
                          </div>
                          <p>{query}</p>
                        </div>
                      </CommandItem>
                    )
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {hasError && (
          <div className="p-6 flex flex-col items-center gap-6 mt-4">
            <IconAlertTriangle className="text-amber-900" strokeWidth={1.5} size={21} />
            <p className="text-lg text-scale-1200 text-center">
              Sorry, looks like Clippy is having a hard time!
            </p>
            <p className="text-sm text-scale-900 text-center">Please try again in a bit.</p>
            <Button size="tiny" type="secondary" onClick={handleReset}>
              Try again?
            </Button>
          </div>
        )}

        <div className="[overflow-anchor:auto] h-px w-full"></div>
      </div>
      <div className="absolute bottom-0 w-full bg-scale-200 py-3">
        <Input
          className="bg-scale-100 rounded mx-3"
          autoFocus
          placeholder={
            isLoading || isResponding
              ? 'Waiting on an answer...'
              : 'Describe what you need and Supabase AI will try to generate the relevant SQL statements'
          }
          value={search}
          actions={
            <>
              {!isLoading && !isResponding ? (
                <div
                  className={`flex items-center gap-3 mr-3 transition-opacity duration-700 ${
                    search ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <span className="text-scale-1100">Submit message</span>
                  <div className="hidden text-scale-1100 md:flex items-center justify-center h-6 w-6 rounded bg-scale-500">
                    <IconCornerDownLeft size={12} strokeWidth={1.5} />
                  </div>
                </div>
              ) : null}
            </>
          }
          onChange={(e) => {
            if (!isLoading || !isResponding) {
              setSearch(e.target.value)
            }
          }}
          onKeyDown={(e) => {
            switch (e.key) {
              case 'Enter':
                if (!search) {
                  return
                }
                if (isLoading || isResponding) {
                  return
                }
                handleSubmit(search)
                return
              default:
                return
            }
          }}
        />
      </div>
    </div>
  )
}

export default GenerateSQL
