import { useEffect, useRef, useState } from 'react'
import { SITE_URL, TWEET_TEXT, TWEET_TEXT_GOLDEN } from '~/lib/constants'
import { IconCheckCircle } from 'ui'
import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'
import { useParams } from '~/hooks/useParams'
import TicketForm from './TicketForm'

type TicketGenerationState = 'default' | 'loading'

type Props = {
  username: string
  golden?: boolean
  ticketGenerationState?: TicketGenerationState
  setTicketGenerationState: (ticketGenerationState: TicketGenerationState) => void
}

export default function TicketActions({
  username,
  golden = false,
  ticketGenerationState,
  setTicketGenerationState,
}: Props) {
  const [imgReady, setImgReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const downloadLink = useRef<HTMLAnchorElement>()
  const link = `${SITE_URL}/tickets/${username}?lw=8${golden ? `&golden=true` : ''}`
  const permalink = encodeURIComponent(link)
  const text = golden ? TWEET_TEXT_GOLDEN : TWEET_TEXT
  const encodedText = encodeURIComponent(text)
  const { userData, supabase } = useConfData()
  const tweetUrl = `https://twitter.com/intent/tweet?url=${permalink}&via=supabase&text=${encodedText}`
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${permalink}`
  const downloadUrl = `https://obuldanrptloktxcffvn.functions.supabase.co/lw8-ticket?username=${encodeURIComponent(
    username
  )}`
  const params = useParams()
  const sharePage = params.username
  const LW_TABLE = 'lw8_tickets'

  useEffect(() => {
    setImgReady(false)

    const img = new Image()

    img.src = downloadUrl
    img.onload = () => {
      setImgReady(true)
      setLoading(false)
      if (downloadLink.current) {
        downloadLink.current.click()
        downloadLink.current = undefined
      }
    }
  }, [downloadUrl])

  const handleShare = async (social: 'twitter' | 'linkedin') => {
    if (!supabase) return
    if (social === 'twitter') {
      await supabase
        .from(LW_TABLE)
        .update({ sharedOnTwitter: 'now' })
        .eq('username', username)
        .is('sharedOnTwitter', null)
    } else if (social === 'linkedin') {
      const res = await supabase
        .from(LW_TABLE)
        .update({ sharedOnLinkedIn: 'now' })
        .eq('username', username)
        .is('sharedOnLinkedIn', null)

      console.log('shareing on LinkedIn', res)
    }
  }

  return (
    <div className="grid gap-1 grid-cols-1 sm:grid-cols-3">
      {!sharePage ? (
        <>
          <div className="rounded bg-[#E6E8EB] text-scale-500 py-1 px-3 border border-[#3e3e3e] text-xs mb-1">
            <div className="flex items-center justify-center gap-2">
              <div className="text-scale-300">
                <IconCheckCircle size={10} strokeWidth={1.5} />
              </div>
              Connect with GitHub
            </div>
          </div>
          <a
            onKeyUp={() => handleShare('twitter')}
            href={tweetUrl}
            rel="noopener noreferrer prefetch"
            target="_blank"
            className={[
              `flex items-center justify-center gap-2 rounded text-scale-500 py-1 px-3 border border-[#3e3e3e] text-xs mb-1 transition-all ease-out hover:text-scale-100 hover:bg-[#dfe1e3]`,
              userData.sharedOnTwitter ? 'bg-[#E6E8EB] text-scale-500' : 'text-white',
            ].join(' ')}
          >
            {userData.sharedOnTwitter && (
              <div className="text-scale-900">
                <IconCheckCircle size={10} strokeWidth={1.5} />
              </div>
            )}
            Share on Twitter
          </a>
          <a
            onKeyUp={() => handleShare('linkedin')}
            href={linkedInUrl}
            rel="noopener noreferrer prefetch"
            target="_blank"
            className={[
              `flex items-center justify-center gap-2 rounded text-scale-500 py-1 px-3 border border-[#3e3e3e] text-xs mb-1 transition-all ease-out hover:text-scale-100 hover:bg-[#dfe1e3]`,
              userData.sharedOnLinkedIn ? 'bg-[#E6E8EB] text-scale-500' : 'text-white',
            ].join(' ')}
          >
            {userData.sharedOnLinkedIn && (
              <div className="text-scale-900">
                <IconCheckCircle size={10} strokeWidth={1.5} />
              </div>
            )}
            Share on Linkedin
          </a>
        </>
      ) : (
        !username && (
          <TicketForm
            defaultUsername={username ?? undefined}
            ticketGenerationState={ticketGenerationState}
            setTicketGenerationState={setTicketGenerationState}
          />
        )
      )}
    </div>
  )
}
