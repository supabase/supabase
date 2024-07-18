import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { codeBlock } from 'common-tags'
import { cn, CodeBlock } from 'ui'
import { Pencil, X } from 'lucide-react'
import Tilt from 'vanilla-tilt'
import { useBreakpoint, useParams } from 'common'

import Panel from '~/components/Panel'
import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'
import TicketProfile from './TicketProfile'
import TicketCustomizationForm from './TicketCustomizationForm'
import TicketNumber from './TicketNumber'
import { LW12_TITLE } from '../../../../lib/constants'

export default function Ticket() {
  const ticketRef = useRef<HTMLDivElement>(null)
  const { userData: user, showCustomizationForm, setShowCustomizationForm } = useConfData()
  const isMobile = useBreakpoint()
  const {
    platinum = false,
    bg_image_id: bgImageId = '1',
    secret: hasSecretTicket,
    ticketNumber,
    username,
  } = user
  const [imageHasLoaded, setImageHasLoaded] = useState(false)
  const params = useParams()
  const sharePage = !!params.username
  const ticketType = hasSecretTicket ? 'secret' : platinum ? 'platinum' : 'regular'

  const fallbackImg = `/images/launchweek/11/tickets/shape/lw11_ticket_${ticketType}.png`

  const ticketBg = {
    regular: {
      background: `/images/launchweek/11/tickets/shape/lw11_ticket_regular.png`,
    },
    platinum: {
      background: `/images/launchweek/11/tickets/shape/lw11_ticket_platinum.png`,
    },
    secret: {
      background: `/images/launchweek/11/tickets/shape/lw11_ticket_purple.png`,
    },
  }

  function handleCustomizeTicket() {
    setShowCustomizationForm && setShowCustomizationForm(!showCustomizationForm)
  }

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

  const code = codeBlock`
await supabase
  .from('tickets')
  .eq('username', ${username})
  .single()
`

  return (
    <div
      ref={ticketRef}
      className="relative w-auto h-auto flex justify-center rounded-xl overflow-hidden will-change-transform"
      style={{ transformStyle: 'preserve-3d', transform: 'perspective(1000px)' }}
    >
      <Panel
        // hasShimmer
        outerClassName="flex relative flex-col w-[360px] border h-auto max-h-[680px] rounded-xl !shadow-xl !p-0"
        innerClassName="flex relative flex-col w-full transition-colors aspect-[396/613] rounded-xl text-left text-sm group/ticket"
        shimmerFromColor="hsl(var(--border-strong))"
        shimmerToColor="hsl(var(--background-default))"
        style={{ transform: 'translateZ(-10px)' }}
      >
        <div className="w-full bg-alternative p-4 border-b flex flex-col gap-4">
          <span className="uppercase text-foreground tracking-wider">
            <strong className="font-medium">Launch Week</strong> 12 Ticket
          </span>
          <CodeBlock
            language="js"
            hideCopy
            className="not-prose !p-0 !bg-transparent border-none [&>code>span>span]:!leading-3 [&>code>span>span]:!min-w-2"
          >
            {code}
          </CodeBlock>
        </div>
        <div className="w-full p-4 flex-grow">asdf</div>
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
