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
  const [_imgReady, setImgReady] = useState(false)
  const [_loading, setLoading] = useState(false)
  const downloadLink = useRef<HTMLAnchorElement>()
  const link = `${SITE_URL}/tickets/${username}?lw=8${golden ? `&golden=true` : ''}`
  const permalink = encodeURIComponent(link)
  const text = golden ? TWEET_TEXT_GOLDEN : TWEET_TEXT
  const encodedText = encodeURIComponent(text)
  const { userData, supabase } = useConfData()
  const tweetUrl = `https://twitter.com/intent/tweet?url=${permalink}&via=supabase&text=${encodedText}`
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${permalink}`
  const downloadUrl = `https://obuldanrptloktxcffvn.supabase.co/functions/v1/lw8-ticket?username=${encodeURIComponent(
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
      await supabase.from(LW_TABLE).update({ sharedOnTwitter: 'now' }).eq('username', username)
      window.open(tweetUrl, '_blank')
    } else if (social === 'linkedin') {
      await supabase.from(LW_TABLE).update({ sharedOnLinkedIn: 'now' }).eq('username', username)
      window.open(linkedInUrl, '_blank')
    }
  }

  return (
    <div className="grid gap-1 grid-cols-1 sm:grid-cols-3">
      {!sharePage ? (
        <>
          <div className="rounded bg-[#E6E8EB] text-background-surface-300 py-1 px-3 border border-[#3e3e3e] text-xs mb-1">
            <div className="flex items-center justify-center gap-2">
              <div className="text-background-surface-100">
                <IconCheckCircle size={10} strokeWidth={1.5} />
              </div>
              Connect with GitHub
            </div>
          </div>
          <button
            onClick={() => handleShare('twitter')}
            className={[
              `flex items-center justify-center gap-2 rounded text-background-surface-300 py-1 px-3 border border-[#3e3e3e] text-xs mb-1 transition-all ease-out hover:text-background-alternative hover:bg-[#dfe1e3]`,
              userData.sharedOnTwitter ? 'bg-[#E6E8EB] text-background-surface-300' : 'text-white',
            ].join(' ')}
          >
            {userData.sharedOnTwitter && (
              <div className="text-muted">
                <IconCheckCircle size={10} strokeWidth={1.5} />
              </div>
            )}
            Share on Twitter
          </button>
          <button
            onClick={() => handleShare('linkedin')}
            className={[
              `flex items-center justify-center gap-2 rounded text-background-surface-300 py-1 px-3 border border-[#3e3e3e] text-xs mb-1 transition-all ease-out hover:text-background-alternative hover:bg-[#dfe1e3]`,
              userData.sharedOnLinkedIn ? 'bg-[#E6E8EB] text-background-surface-300' : 'text-white',
            ].join(' ')}
          >
            {userData.sharedOnLinkedIn && (
              <div className="text-muted">
                <IconCheckCircle size={10} strokeWidth={1.5} />
              </div>
            )}
            Share on Linkedin
          </button>
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
