import { useEffect, useRef, useState } from 'react'
import { codeBlock } from 'common-tags'
import { CodeBlock } from 'ui'
import { range } from 'lodash'
import { Pencil, X } from 'lucide-react'
import Tilt from 'vanilla-tilt'
import { useParams } from 'common'

import Panel from '~/components/Panel'
import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'
import TicketCustomizationForm from './TicketCustomizationForm'
import { themes as ticketThemes } from './ticketThemes'

export default function Ticket() {
  const ticketRef = useRef<HTMLDivElement>(null)
  const { userData: user, showCustomizationForm, setShowCustomizationForm } = useConfData()
  const { platinum = false, secret: hasSecretTicket, ticket_number: ticketNumber, username } = user
  const params = useParams()
  const [responseTime, setResponseTime] = useState<{ start: number; end: number | undefined }>({
    start: performance.now(),
    end: undefined,
  })
  const sharePage = !!params.username
  const ticketType = hasSecretTicket ? 'secret' : platinum ? 'platinum' : 'regular'
  const TICKET_THEME = ticketThemes[ticketType]

  function handleCustomizeTicket() {
    setShowCustomizationForm && setShowCustomizationForm(!showCustomizationForm)
  }

  useEffect(() => {
    user && setResponseTime((prev) => ({ ...prev, end: performance.now() }))
  }, [user.id])

  useEffect(() => {
    if (ticketRef.current && !window.matchMedia('(pointer: coarse)').matches) {
      Tilt.init(ticketRef.current, {
        glare: true,
        max: 3,
        gyroscope: true,
        'max-glare': 0.1,
        'full-page-listening': true,
      })
    }
  }, [ticketRef])

  const code = codeBlock`await supabase
  .from('tickets')
  .select('*')
  .eq('launch_week', 'lw12')
  .eq('username', '${username}')
  .single()
`

  const HAS_ROLE = true // user.role
  const HAS_COMPANY = true // user.company
  const HAS_LOCATION = true // user.location

  // Keep following indentation for proper json layout with conditionals
  const responseJson = codeBlock`
{
  "data": {
    "name": "${user.name}",
    "username": "${username}",
    "ticket_number": "${ticketNumber}",
    "role": ${user.role ? `"${user.role}"` : 'null'},
    "company": ${user.company ? `"${user.company}"` : 'null'},
    "location": ${user.location ? `"${user.location}"` : 'null'},
  },
  "error": null
}
`

  function getLinesToHighlight() {
    let arr: any[] = range(0, 3)
    const STARTING_LINE = 3

    if (HAS_ROLE) arr.push(null)
    if (HAS_COMPANY) arr.push(null)
    if (HAS_LOCATION) arr.push(null)

    return arr.map((_, i) => i + STARTING_LINE)
  }

  const LINES_TO_HIGHLIGHT = getLinesToHighlight()

  const resTime = (responseTime.end! - responseTime.start).toFixed()

  return (
    <div
      ref={ticketRef}
      className="relative w-auto h-auto flex justify-center rounded-xl overflow-hidden will-change-transform"
      style={{ transformStyle: 'preserve-3d', transform: 'perspective(1000px)' }}
    >
      <Panel
        outerClassName="dark flex relative flex-col w-[360px] border h-auto max-h-[680px] rounded-xl !shadow-xl !p-0"
        innerClassName="flex relative flex-col w-full transition-colors aspect-[3/4] rounded-xl text-left text-sm group/ticket"
        shimmerFromColor="hsl(var(--border-strong))"
        shimmerToColor="hsl(var(--background-default))"
        style={{ transform: 'translateZ(-10px)', borderColor: TICKET_THEME.TICKET_BORDER }}
        innerStyle={{ background: TICKET_THEME.TICKET_BACKGROUND }}
      >
        <div
          className="w-full p-4 border-b flex flex-col gap-4"
          style={{
            color: TICKET_THEME.TICKET_BACKGROUND_CODE,
            borderColor: TICKET_THEME.TICKET_BORDER,
            backgroundColor: TICKET_THEME.TICKET_BACKGROUND_CODE,
          }}
        >
          <span
            className="uppercase tracking-wider"
            style={{ color: TICKET_THEME.TICKET_FOREGROUND }}
          >
            <strong className="font-medium">Launch Week</strong> 12 Ticket
          </span>
          <CodeBlock
            language="jsx"
            hideCopy
            theme={TICKET_THEME.CODE_THEME}
            styleConfig={{
              lineNumber: TICKET_THEME.CODE_LINE_NUMBER,
            }}
            className="not-prose !p-0 !bg-transparent border-none [&>code>span>span]:!leading-3 [&>code>span>span]:!min-w-2"
          >
            {code}
          </CodeBlock>
        </div>
        <div className="w-full py-4 flex-grow flex flex-col gap-4">
          <span
            className="px-4 uppercase tracking-wider text-xs font-mono"
            style={{ color: TICKET_THEME.CODE_LINE_NUMBER }}
          >
            TICKET RESPONSE
          </span>
          {user && (
            <CodeBlock
              language="json"
              hideCopy
              theme={TICKET_THEME.CODE_THEME}
              linesToHighlight={LINES_TO_HIGHLIGHT}
              styleConfig={{
                lineNumber: TICKET_THEME.CODE_LINE_NUMBER,
                highlightBackgroundColor: TICKET_THEME.CODE_HIGHLIGHT_BACKGROUND,
                highlightBorderColor: TICKET_THEME.CODE_HIGHLIGHT_BORDER,
              }}
              highlightBorder
              className="not-prose !p-0 !bg-transparent border-none [&>code>span>span]:!leading-3 [&>code>span>span]:!min-w-2 [&>code>span]:!pl-4"
            >
              {responseJson}
            </CodeBlock>
          )}
          {/* <span className="px-4 text-xs" style={{ color: TICKET_THEME.TICKET_FOREGROUND_LIGHT }}>
            {resTime}ms <span className="uppercase">Response time</span>
          </span> */}
        </div>
        {/* Edit hover button */}
        {!sharePage && (
          <>
            <button
              className="absolute z-40 inset-0 w-full h-full outline-none"
              onClick={handleCustomizeTicket}
            />
            <div className="flex md:translate-y-3 opacity-100 md:opacity-0 group-hover/ticket:opacity-100 group-hover/ticket:md:translate-y-0 transition-all absolute z-30 right-4 top-4 md:inset-0 m-auto w-10 h-10 rounded-full items-center justify-center bg-surface-100 dark:bg-[#020405] border shadow-lg text-foreground">
              {!showCustomizationForm ? <Pencil className="w-4" /> : <X className="w-4" />}
            </div>
          </>
        )}
      </Panel>
      {!sharePage && (
        <TicketCustomizationForm className="absolute inset-0 top-auto z-40 order-last md:order-first" />
      )}
    </div>
  )
}
