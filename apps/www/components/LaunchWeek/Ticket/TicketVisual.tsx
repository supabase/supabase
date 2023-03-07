import styles from './ticket-visual.module.css'
import TicketProfile from './TicketProfile'
import TicketNumber from './TicketNumber'
import TicketMono from './ticket-mono'
import TicketMonoMobile from './ticket-mono-mobile'
import { useRouter } from 'next/router'
import useConfData from '~/components/LaunchWeek/Ticket/hooks/use-conf-data'
import TicketHeader from './TicketHeader'
import { useState } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'
import Image from 'next/image'

type TicketGenerationState = 'default' | 'loading'
type Props = {
  size?: number
  name?: string
  ticketNumber?: number
  bgImageId?: number
  username?: string
  ticketGenerationState?: TicketGenerationState
  setTicketGenerationState?: any
  golden?: boolean
}

export default function TicketVisual({
  size = 1,
  name,
  username,
  bgImageId,
  ticketNumber,
  ticketGenerationState = 'default',
  setTicketGenerationState,
  golden = false,
}: Props) {
  const { session } = useConfData()
  // golden = true

  const router = useRouter()
  const basePath = router.basePath
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [imageIsLoading, setImageIsLoading] = useState(true)
  // const randomNumber = Math.floor(Math.random() * 200) + 1
  // const goldRandomNumber = Math.floor(Math.random() * 56) + 1
  const storageBaseFilepath = `https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/lw7/tickets_bg`
  const goldenImageId = Math.floor(bgImageId! / 56)

  return (
    <div
      className={[
        styles.visual,
        golden ? styles['visual--gold'] : '',
        session ? styles['visual--logged-in'] : '',
        'flex relative flex-col flex-1 justify-between rounded-2xl bg-black w-full h-full box-border before:rounded-2xl',
      ].join(' ')}
      style={{
        ['--size' as string]: size,
      }}
      id="wayfinding--ticket-visual-inner-container"
    >
      <div id="wayfinding--ticket-dynamic-bg-image">
        <Image
          src={
            golden
              ? `${storageBaseFilepath}/golden/_jpg/gold_bg_${goldenImageId}.jpg`
              : `${storageBaseFilepath}/_jpg/reg_bg_${bgImageId}.jpg`
          }
          layout="fill"
          objectFit="cover"
          placeholder="blur"
          blurDataURL="/images/blur.png"
          className={[
            'duration-700 ease-in-out rounded-xl',
            imageIsLoading ? 'grayscale blur-2xl scale-110' : 'grayscale-0 blur-0 scale-100',
          ].join(' ')}
          onLoadingComplete={() => setImageIsLoading(false)}
        />
      </div>
      <div className="relative z-10 flex flex-col items-center justify-between w-full h-full flex-1 md:pr-[110px]">
        {username && <TicketHeader />}
        <div
          className="flex-1 w-full h-full md:h-auto flex flex-col justify-center"
          id="wayfinding--TicketProfile-container"
        >
          <TicketProfile
            name={name}
            username={username}
            size={size}
            ticketGenerationState={ticketGenerationState}
            setTicketGenerationState={setTicketGenerationState}
            golden={golden}
          />
        </div>
      </div>
      <TicketNumber number={ticketNumber} />
      <div className="hidden md:flex absolute inset-0" id="wayfinding--TicketMono-container">
        <TicketMono golden={golden} />
      </div>
      <div className="flex md:hidden absolute inset-0">
        <TicketMonoMobile golden={golden} />
      </div>
    </div>
  )
}
