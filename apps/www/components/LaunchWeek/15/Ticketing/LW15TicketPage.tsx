import { useState } from 'react'
import dayjs from 'dayjs'
import { Button, cn } from 'ui'
import SectionContainer from 'components/Layouts/SectionContainer'
import useLw15ConfData, { UserTicketData } from 'components/LaunchWeek/15/hooks/use-conf-data'
import { useRegistration } from '../hooks/use-registration'
import { LWSVG, FifteenSVG, LW15ThemeSwitcher } from '../lw15.components'
import LW15Ticket from './LW15Ticket'
import LW15TicketShare from './LW15TicketShare'
import TicketURLCopy from './TicketURLCopy'
import { TYPO_COLORS, BG_COLORS } from './colors'
import { updateTicketColors } from '../hooks/use-registration'
import Link from 'next/link'

const LW15TicketPage = ({
  user: userFromProps,
  isSharePage,
}: {
  user?: UserTicketData
  isSharePage?: boolean
}) => {
  const register = useRegistration()
  const [state, setState] = useState({ saving: false })
  const [confState] = useLw15ConfData()
  const user = isSharePage ? userFromProps : confState.userTicketData
  const isLoggedTicketOwner = user?.username === confState.userTicketData?.username

  const selectedFg = user?.metadata?.colors?.foreground || TYPO_COLORS[0]
  const selectedBg = user?.metadata?.colors?.background || BG_COLORS[0]

  const handleColorChange = async (type: 'foreground' | 'background', color: string) => {
    if (!user?.username) return
    const newColors = {
      background: type === 'background' ? color : selectedBg,
      foreground: type === 'foreground' ? color : selectedFg,
    }
    setState({ saving: true })
    try {
      await updateTicketColors({
        username: user?.username!,
        userMetadata: user?.metadata,
        background: newColors.background,
        foreground: newColors.foreground,
      })
    } finally {
      setState({ saving: false })
    }
  }

  const TicketCustomizationSection = ({ className }: { className?: string }) => (
    <div
      className={cn(
        'flex flex-col gap-12 pt-4 w-full border-t',
        isSharePage && 'border-t-0 lg:border-t pt-0 lg:pt-4',
        className
      )}
    >
      {!isSharePage && (
        <div className="grid grid-cols-6 w-full gap-4">
          <p className="col-span-full xl:col-span-3 lg:text-xs xl:max-w-[230px]">
            Customize your ticket
          </p>
          <div className="col-span-full xl:col-span-3 xl:col-start-4 flex flex-col gap-4">
            <div className="w-full grid grid-cols-3">
              <p>Typo color</p>
              <div className="flex flex-col col-span-2">
                <div className="flex gap-2 flex-wrap justify-end">
                  {TYPO_COLORS.map((color) => (
                    <button
                      key={color}
                      className={cn(
                        'flex-1 max-w-5 aspect-square rounded-full border flex items-center justify-center transition-all',
                        selectedFg === color && 'border-background ring-1 ring-foreground scale-110'
                      )}
                      style={{ background: color }}
                      aria-label={color}
                      onClick={() => handleColorChange('foreground', color)}
                      disabled={state.saving}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="w-full grid grid-cols-3">
              <p>Bg color</p>
              <div className="flex flex-col col-span-2">
                <div className="flex gap-2 flex-wrap justify-end">
                  {BG_COLORS.map((color) => (
                    <button
                      key={color}
                      className={cn(
                        'flex-1 max-w-5 aspect-square rounded-full border flex items-center justify-center transition-all',
                        selectedBg === color && 'border-background ring-1 ring-foreground scale-110'
                      )}
                      style={{ background: color }}
                      aria-label={color}
                      onClick={() => handleColorChange('background', color)}
                      disabled={state.saving}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="hidden lg:flex justify-between items-end gap-4 text-xs">
        <div className="flex flex-col">
          <p>Ticket ID: #{user?.ticket_number}</p>
          <p>Claimed at: {dayjs(user?.created_at).format('DD MMM / HH:mm')}</p>
        </div>
        <LW15ThemeSwitcher />
      </div>
    </div>
  )

  const handleClaimTicket = () => register.signIn()

  return (
    <SectionContainer className="flex flex-col lg:grid lg:grid-cols-2 gap-6 !py-8 md:!py-10 h-full !min-h-[calc(100dvh-66px)]">
      <div className="flex flex-col h-full justify-between gap-6 lg:gap-20">
        <div className="grid grid-cols-6 gap-4">
          <div className="col-span-full w-full hidden lg:flex items-center justify-between h-[60px] md:h-[90px] lg:h-[120px] gap-4">
            <h1 className="sr-only">Supabase Launch Week 15</h1>
            <LWSVG className="h-full w-auto" />
            <FifteenSVG className="h-full w-auto" />
          </div>
          <div className="col-span-5 text-2xl lg:text-4xl">
            {isSharePage ? (
              <>
                {user?.name?.split(' ')[0]}'s Ticket
                <br />
                Want your own?
              </>
            ) : (
              <>
                Hey @{user?.username}, <br />
                customize your <br className="hidden lg:block" />
                Launch Week ticket
              </>
            )}
          </div>
          {isSharePage && !isLoggedTicketOwner && (
            <div className="col-span-full">
              <Button
                className="h-auto py-1 px-2 min-w-[125px] min-h-[28px]"
                type="secondary"
                size="medium"
                onClick={handleClaimTicket}
              >
                Claim your ticket
              </Button>
            </div>
          )}
          {isSharePage && isLoggedTicketOwner && (
            <div className="col-span-full">
              <Button className="h-auto py-1 px-2" type="secondary" size="medium" asChild>
                <Link href="/launch-week/ticket">Customize your ticket</Link>
              </Button>
            </div>
          )}
        </div>
        <TicketCustomizationSection />
      </div>
      <div
        className="w-full border border-muted h-full bg-surface-300 flex items-center justify-center p-8 transition-colors duration-300"
        style={{ background: `${selectedFg}07` }}
      >
        <div className="flex flex-col justify-center gap-8 h-fit">
          <LW15Ticket user={user} />
          <div className="flex flex-col gap-1">
            <TicketURLCopy user={user} />
            {!isSharePage && <LW15TicketShare />}
          </div>
        </div>
      </div>
    </SectionContainer>
  )
}

export default LW15TicketPage
