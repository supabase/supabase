import { useState } from 'react'
import { cn } from 'ui'
import SectionContainer from 'components/Layouts/SectionContainer'
import useLw15ConfData from 'components/LaunchWeek/15/hooks/use-conf-data'
import { useRegistration } from '../hooks/use-registration'
import { LWSVG, FifteenSVG, LW15ThemeSwitcher } from '../lw15.components'
import LW15Ticket from './LW15Ticket'
import LW15TicketShare from './LW15TicketShare'
import TicketURLCopy from './TicketUrlCopy'
import { TYPO_COLORS, BG_COLORS } from './colors'
import { updateTicketColors } from '../hooks/use-registration'

const LW15TicketPage = () => {
  useRegistration()
  const [state, setState] = useState({ saving: false })
  const [confState] = useLw15ConfData()
  const user = confState.userTicketData
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
        username: user.username!,
        background: newColors.background,
        foreground: newColors.foreground,
      })
    } finally {
      setState({ saving: false })
    }
  }

  return (
    <SectionContainer className="flex flex-col lg:grid lg:grid-cols-2 gap-4 !py-10 h-full">
      <div className="flex flex-col h-full justify-between">
        <div className="grid grid-cols-6 gap-4">
          <div className="col-span-full w-full flex items-center justify-between h-[60px] md:h-[90px] lg:h-[120px] gap-4">
            <h1 className="sr-only">Supabase Launch Week 15</h1>
            <LWSVG className="h-full w-auto" />
            <FifteenSVG className="h-full w-auto" />
          </div>
          <div className="col-span-5 text-2xl lg:text-4xl">
            Hey @{user.username}, customize your Launch Week ticket
          </div>
        </div>
        <div className="hidden w-full lg:flex flex-col gap-12 border-t pt-4">
          <div className="grid grid-cols-6 w-full gap-4">
            <p className="col-span-2">
              No templates, just tools to help you shape the output exactly how you want it.
            </p>
            <div className="col-span-3 col-start-4 flex flex-col gap-4">
              <div className="w-full grid grid-cols-3">
                <p>Typo color</p>
                <div className="flex flex-col col-span-2">
                  <div className="flex gap-2 flex-wrap">
                    {TYPO_COLORS.map((color) => (
                      <button
                        key={color}
                        className={cn(
                          'flex-1 aspect-square rounded-full border border-control flex items-center justify-center transition-all',
                          selectedFg === color
                            ? 'border-background ring-1 ring-foreground scale-110'
                            : 'border-transparent'
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
                  <div className="flex gap-2 flex-wrap">
                    {BG_COLORS.map((color) => (
                      <button
                        key={color}
                        className={cn(
                          'flex-1 aspect-square rounded-full border border-control flex items-center justify-center transition-all',
                          selectedBg === color
                            ? 'border-background ring-1 ring-foreground scale-110'
                            : 'border-transparent'
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
          <div className="flex justify-between items-end gap-4 text-xs">
            <div className="flex flex-col">
              <p>Ticket ID: #{user.ticket_number}</p>
              <p>Accepted at: {user.username}</p>
            </div>
            <LW15ThemeSwitcher />
          </div>
        </div>
      </div>
      <div
        className="w-full min-h-fit h-full bg-surface-300 flex items-center justify-center p-8"
        style={{ background: selectedFg }}
      >
        <div className="flex flex-col justify-center gap-8 h-full">
          <LW15Ticket />
          <div className="flex flex-col gap-1">
            <TicketURLCopy />
            <LW15TicketShare />
          </div>
        </div>
      </div>
    </SectionContainer>
  )
}

export default LW15TicketPage
