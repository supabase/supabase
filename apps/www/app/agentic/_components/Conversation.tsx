import { CheckIcon, ChevronRightIcon, Loader2Icon } from 'lucide-react'
import { useEffect, useMemo, useState, type AnimationEvent } from 'react'
import { cn, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui'

import { ChatEmbed } from './ChatEmbed'
import type { ChatMessage, ToolCall } from './content'

// The tool rows below follow the Studio Assistant's `ToolGroup` and `Tool`, which www can't import.

// How long each moment of the conversation holds before the next one
const SLIDE_MS = 350
const AFTER_SENT_MS = 600
const THINKING_MS = 700
const TOOL_MS = 800
const EMBED_MS = 500
const AFTER_AGENT_MS = 1400

const REVEAL = 'animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none'

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1)

/** A finished group's header: what its tool calls did, e.g. "Queried logs and traced request". */
function getToolSummary(tools: ToolCall[]) {
  const [first, second, ...rest] = [...new Set(tools.map((tool) => tool.done))]
  if (!second) return first
  if (rest.length === 0) return `${first} and ${lowerFirst(second)}`
  return `${first}, ${lowerFirst(second)}, and ${rest.length} more`
}

// Each message starts at a beat, and `holds[n]` is how long the conversation stays on beat n.
// An agent message thinks for a beat, takes a beat per tool, shows any embed, and then answers.
function buildTimeline(messages: ChatMessage[]) {
  const holds = [SLIDE_MS]
  const timed = messages.map((message) => {
    const startsAt = holds.length
    if (message.from === 'agent') {
      const tools = message.tools ?? []
      if (tools.length > 0) holds.push(THINKING_MS, ...tools.map(() => TOOL_MS))
      if (message.embed) holds.push(EMBED_MS)
      holds.push(AFTER_AGENT_MS)
    } else holds.push(AFTER_SENT_MS)
    return { message, startsAt }
  })
  return { holds, timed, lastBeat: holds.length - 1 }
}

// A short panel can't show the whole conversation, so it follows along
function followAlong(event: AnimationEvent<HTMLElement>) {
  if (event.target !== event.currentTarget) return
  event.currentTarget.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}

function ToolGroup({ tools, progress }: { tools: ToolCall[]; progress: number }) {
  // Progress counts from -1 while thinking, through each tool, to `tools.length` when finished
  const isRunning = progress < tools.length
  const runningTool = tools[progress]

  let label = getToolSummary(tools)
  if (isRunning) label = runningTool ? `${runningTool.running}...` : 'Thinking...'

  return (
    <Collapsible className="w-full text-foreground-lighter">
      <CollapsibleTrigger className="group/tool-group flex w-full items-center gap-2 py-2 text-left">
        <ChevronRightIcon
          aria-hidden
          strokeWidth={1.5}
          size={12}
          className="shrink-0 transition-transform duration-200 ease-out group-data-open/tool-group:rotate-90"
        />
        {/* A new label fades in rather than snapping. The shimmer is an animation of its own, so it
            needs its own element. */}
        <span
          key={label}
          className="min-w-0 truncate animate-in fade-in duration-200 motion-reduce:animate-none"
        >
          <span className={cn(isRunning && 'shimmer')}>{label}</span>
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-open:animate-collapsible-down data-closed:animate-collapsible-up">
        <div className="ml-1.5 border-l border-muted pl-4">
          {tools.slice(0, Math.max(progress + 1, 0)).map((tool, index) => {
            const isToolRunning = index === progress
            return (
              <div
                key={tool.done}
                className="flex items-center gap-2 border-b border-muted py-2 last:border-b-0"
              >
                {isToolRunning ? (
                  <Loader2Icon aria-hidden strokeWidth={1.5} size={12} className="animate-spin" />
                ) : (
                  <CheckIcon
                    aria-hidden
                    strokeWidth={1.5}
                    size={12}
                    className="shrink-0 text-foreground-muted"
                  />
                )}
                <span className={cn('min-w-0 truncate', isToolRunning && 'shimmer')}>
                  {isToolRunning ? `${tool.running}...` : tool.done}
                  {tool.detail && !isToolRunning && ` ${tool.detail}`}
                </span>
              </div>
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function Conversation({ messages, playing }: { messages: ChatMessage[]; playing: boolean }) {
  const { holds, timed, lastBeat } = useMemo(() => buildTimeline(messages), [messages])
  // Null until it first plays: the whole conversation is there, for the server HTML
  const [beat, setBeat] = useState<number | null>(null)
  const [wasPlaying, setWasPlaying] = useState(playing)

  if (playing !== wasPlaying) {
    setWasPlaying(playing)
    // Starts over in this same render, so the finished conversation never flashes. Stopping leaves
    // the beat alone, so a half-played conversation doesn't fill in while it fades out.
    if (playing) setBeat(0)
  }

  useEffect(() => {
    if (!playing) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setBeat(lastBeat)
      return
    }
    let timer: ReturnType<typeof setTimeout>
    const advance = (from: number) => {
      if (from >= lastBeat) return
      timer = setTimeout(() => {
        setBeat(from + 1)
        advance(from + 1)
      }, holds[from])
    }
    advance(0)
    return () => clearTimeout(timer)
  }, [playing, holds, lastBeat])

  const current = beat ?? lastBeat

  // Lines wait with their space held, so nothing shifts as the conversation fills in
  const revealAt = (startsAt: number) => {
    if (current < startsAt) return 'invisible'
    return beat === null ? undefined : REVEAL
  }

  return (
    <ol aria-label="Example conversation" className="flex flex-col gap-6">
      {timed.map(({ message, startsAt }) => {
        // An event from the platform starts a conversation the same way a person does
        if (message.from !== 'agent') {
          return (
            <li
              key={message.text}
              onAnimationStart={followAlong}
              className={cn('ml-auto flex max-w-5/6 flex-col items-end gap-1', revealAt(startsAt))}
            >
              {message.from === 'system' && (
                <span className="text-sm text-foreground-lighter">Sent by {message.sender}</span>
              )}
              <span className="rounded-2xl rounded-br-md bg-surface-200 px-3.5 py-2 text-foreground">
                {message.from === 'user' && <span className="sr-only">You: </span>}
                {message.text}
              </span>
            </li>
          )
        }

        const tools = message.tools ?? []
        const embedAt = tools.length > 0 ? startsAt + tools.length + 1 : startsAt
        const textAt = message.embed ? embedAt + 1 : embedAt
        return (
          <li key={message.text} className="flex flex-col gap-2">
            <span className="sr-only">Agent: </span>
            {tools.length > 0 && (
              <div onAnimationStart={followAlong} className={revealAt(startsAt)}>
                <ToolGroup
                  tools={tools}
                  progress={Math.min(current - startsAt - 1, tools.length)}
                />
              </div>
            )}
            {message.embed && (
              <div onAnimationStart={followAlong} className={cn('pb-1', revealAt(embedAt))}>
                <ChatEmbed embed={message.embed} />
              </div>
            )}
            <span
              onAnimationStart={followAlong}
              className={cn('text-foreground-light', revealAt(textAt))}
            >
              {message.text}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
