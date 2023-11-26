import { useEffect, useRef, useState } from 'react'
import { SITE_URL, TWEET_TEXT, TWEET_TEXT_GOLDEN } from '~/lib/constants'
import { Button, IconLinkedinSolid, IconTwitterX, cn } from 'ui'
import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'
import { useParams } from '~/hooks/useParams'
import TicketCopy from './TicketCopy'

type Props = {
  username: string
  golden?: boolean
}

export default function TicketActions({ username, golden = false }: Props) {
  const [_imgReady, setImgReady] = useState(false)
  const [_loading, setLoading] = useState(false)
  const downloadLink = useRef<HTMLAnchorElement>()
  const link = `${SITE_URL}/tickets/${username}?lw=x${golden ? `&platinum=true` : ''}`
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
  const sharePage = !!params.username
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

    setTimeout(async () => {
      if (social === 'twitter') {
        await supabase.from(LW_TABLE).update({ sharedOnTwitter: 'now' }).eq('username', username)
        window.open(tweetUrl, '_blank')
      } else if (social === 'linkedin') {
        await supabase.from(LW_TABLE).update({ sharedOnLinkedIn: 'now' }).eq('username', username)
        window.open(linkedInUrl, '_blank')
      }
    })
  }

  return (
    <div
      className={cn(
        'w-full gap-3 flex flex-col md:flex-row items-center',
        sharePage ? 'justify-center' : 'justify-between'
      )}
    >
      <TicketCopy sharePage={sharePage} />
      {!sharePage && (
        <div className="flex gap-1">
          <Button
            onClick={() => handleShare('twitter')}
            type={userData.sharedOnTwitter ? 'secondary' : 'default'}
            icon={<IconTwitterX className="text-light w-3" />}
            size="tiny"
          >
            Share on X
          </Button>
          <Button
            onClick={() => handleShare('linkedin')}
            type={userData.sharedOnLinkedIn ? 'secondary' : 'default'}
            icon={<IconLinkedinSolid className="text-light w-3" />}
            size="tiny"
          >
            Share on Linkedin
          </Button>
        </div>
      )}
    </div>
  )
}
