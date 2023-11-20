import { useEffect, useRef, useState } from 'react'
import { SITE_URL, TWEET_TEXT, TWEET_TEXT_GOLDEN } from '~/lib/constants'
import { Button, IconCheck } from 'ui'
import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'
import { useParams } from '~/hooks/useParams'
import TicketForm from './TicketForm'

type Props = {
  username: string
  golden?: boolean
}

export default function TicketActions({ username, golden = false }: Props) {
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
  const downloadUrl = `https://obuldanrptloktxcffvn.supabase.co/functions/v1/lwx-ticket?username=${encodeURIComponent(
    username
  )}`
  const params = useParams()
  const sharePage = params.username
  const LW_TABLE = 'lwx_tickets'

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
    <div className="grid gap-1 sm:gap-3 grid-cols-1 sm:grid-cols-2">
      {!sharePage ? (
        <>
          {/* <div className="rounded bg-[#E6E8EB] text-background-surface-300 py-1 px-3 border border-[#3e3e3e] text-xs mb-1">
            <div className="flex items-center justify-center gap-2">
              <div className="text-background-surface-100">
                <IconCheckCircle size={10} strokeWidth={1.5} />
              </div>
              Connect with GitHub
            </div>
          </div> */}
          <Button
            onClick={() => handleShare('twitter')}
            type={userData.sharedOnTwitter ? 'secondary' : 'default'}
            className="rounded py-1 px-3 border border-[#3e3e3e] text-xs mb-1 transition-all ease-out"
          >
            <div className="flex items-center justify-center gap-2">
              {userData.sharedOnTwitter && (
                <IconCheck size={10} strokeWidth={2.5} className="text-muted" />
              )}
              Share on X
            </div>
          </Button>
          <Button
            onClick={() => handleShare('linkedin')}
            type={userData.sharedOnLinkedIn ? 'secondary' : 'default'}
            className="flex items-center justify-center gap-2 rounded py-1 px-3 border border-[#3e3e3e] text-xs mb-1 transition-all ease-out"
            icon
          >
            <div className="flex items-center justify-center gap-2">
              {userData.sharedOnLinkedIn && (
                <IconCheck size={10} strokeWidth={2.5} className="text-muted" />
              )}
              Share on Linkedin
            </div>
          </Button>
        </>
      ) : (
        !username && <TicketForm />
      )}
    </div>
  )
}
