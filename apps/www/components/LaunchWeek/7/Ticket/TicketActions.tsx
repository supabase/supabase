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
  const permalink = (medium: string) =>
    encodeURIComponent(`${SITE_URL}/tickets/${username}?lw=7${golden ? `&golden=true` : ''}`)
  const text = encodeURIComponent(golden ? TWEET_TEXT_GOLDEN : TWEET_TEXT)
  const { userData } = useConfData()
  const tweetUrl = `https://twitter.com/intent/tweet?url=${permalink(
    'twitter'
  )}&via=supabase&text=${text}`
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${permalink('linkedin')}`
  const downloadUrl = `https://obuldanrptloktxcffvn.supabase.co/functions/v1/lw7-ticket-og?username=${encodeURIComponent(
    username
  )}`
  const params = useParams()
  const sharePage = params.username

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

  return (
    <div className="grid gap-1 grid-cols-1 sm:grid-cols-3 lg:grid-cols-1">
      {!sharePage ? (
        <>
          <div className="rounded-full bg-[#E6E8EB] text-background-surface-300 py-1 px-3 border border-[#dfe1e3] text-xs mb-1">
            <div className="flex items-center justify-center gap-2">
              <div className="text-muted">
                <IconCheckCircle size={10} strokeWidth={1} />
              </div>
              Connect with GitHub
            </div>
          </div>
          <div
            className={`rounded-full ${
              userData.sharedOnTwitter ? 'bg-[#E6E8EB] text-background-surface-300' : 'text-white'
            } text-background-surface-300 py-1 px-3 border border-[#dfe1e3] text-xs mb-1 transition-all ease-out hover:bg-[#dfe1e3]`}
          >
            <a
              href={tweetUrl}
              rel="noopener noreferrer prefetch"
              target="_blank"
              className={`flex items-center justify-center gap-2 ${
                userData.sharedOnTwitter
                  ? 'text-background-surface-300'
                  : 'text-white hover:text-background-surface-300'
              }`}
            >
              {userData.sharedOnTwitter && (
                <div className="text-muted">
                  <IconCheckCircle size={10} strokeWidth={1} />
                </div>
              )}
              Share on Twitter
            </a>
          </div>
          <div
            className={`rounded-full ${
              userData.sharedOnLinkedIn ? 'bg-[#E6E8EB] text-background-surface-300' : 'text-white'
            }  text-background-surface-300 py-1 px-3 border border-[#dfe1e3] text-xs mb-1 transition-all ease-out hover:bg-[#dfe1e3]`}
          >
            <a
              href={linkedInUrl}
              rel="noopener noreferrer prefetch"
              target="_blank"
              className={`flex items-center justify-center gap-2 ${
                userData.sharedOnLinkedIn
                  ? 'text-background-surface-300'
                  : 'text-white hover:text-background-surface-300'
              }`}
            >
              {userData.sharedOnLinkedIn && (
                <div className="text-muted">
                  <IconCheckCircle size={10} strokeWidth={1} />
                </div>
              )}
              Share on Linkedin
            </a>
          </div>
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
