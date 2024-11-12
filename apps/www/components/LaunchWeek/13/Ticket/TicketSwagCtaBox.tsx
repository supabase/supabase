import NextImage from 'next/image'
import { cn } from 'ui'
import TicketActions from './TicketActions'
import TicketCopy from './TicketCopy'
import { UserData } from '../../hooks/use-conf-data'
import useWinningChances from '../../hooks/useWinningChances'

interface Props {
  className?: string
  hasPlatinumTicket: boolean
  hasSecretTicket: boolean
  userData: UserData
  firstName: string
}

export default function TicketSwagCtaBox({
  className,
  hasPlatinumTicket,
  hasSecretTicket,
  userData,
  firstName,
}: Props) {
  const winningChances = useWinningChances()

  return (
    <div
      className={cn(
        'bg-surface-75/80 backdrop-blur-sm border border-overlay w-full h-auto flex flex-col rounded-lg overflow-hidden shadow-xl',
        className
      )}
    >
      <div className="flex flex-row gap-3 items-center">
        <div className="relative flex items-center justify-center h-auto w-2/5 aspect-square object-center border-muted overflow-hidden bg-surface-100">
          {/* <NextImage
            src="/images/launchweek/12/lw12-backpack-crop.png"
            alt="Supabase LW12 Wandrd backpack"
            draggable={false}
            width={300}
            height={300}
            className="object-top mx-auto bg-foreground bg-center inset-x-0 w-auto h-full opacity-90 dark:opacity-50 pointer-events-none"
          /> */}
        </div>
        <div className="flex flex-col gap-2 pl-4 md:pl-6 pr-12 text-left text-foreground-light text-sm">
          {hasPlatinumTicket ? (
            <div>
              {hasSecretTicket ? (
                <p>
                  Share your secret ticket to boost your chances of winning limited-edition swag.
                </p>
              ) : (
                <p>Follow Launch Week 13 announcements to find out if you're a lucky winner.</p>
              )}
            </div>
          ) : winningChances !== 2 ? (
            <p>Share your ticket to increase your chances of winning limited-edition swag.</p>
          ) : (
            <p>
              Now share on{' '}
              <span className="text-foreground">
                {!userData.shared_on_linkedin ? 'LinkedIn' : 'Twitter'}
              </span>{' '}
              to increase your chances of winning limited swag.
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2 p-2 bg-alternative/70 border-t border-muted w-full">
        <TicketActions />
        <TicketCopy />
      </div>
    </div>
  )
}
