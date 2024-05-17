import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  SPECIAL_ANNOUNCEMENT_URL,
  TWEET_TEXT,
  TWEET_TEXT_PLATINUM,
  TWEET_TEXT_SECRET,
} from '~/lib/constants'
import { Button, IconLinkedinSolid, IconTwitterX, cn } from 'ui'
import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'
import { useParams } from '~/hooks/useParams'
import { useBreakpoint } from 'common'
import dayjs from 'dayjs'

export default function TicketActions() {
  const { userData, supabase } = useConfData()
  const { platinum, username, metadata, secret: hasSecretTicket } = userData
  const [_imgReady, setImgReady] = useState(false)
  const [_loading, setLoading] = useState(false)
  const isTablet = useBreakpoint(1280)
  const downloadLink = useRef<HTMLAnchorElement>()
  const link = `${SPECIAL_ANNOUNCEMENT_URL}/tickets/${username}?lw=11${
    hasSecretTicket ? '&secret=true' : platinum ? `&platinum=true` : ''
  }&t=${dayjs(new Date()).format('DHHmmss')}`
  const permalink = encodeURIComponent(link)
  const text = hasSecretTicket ? TWEET_TEXT_SECRET : platinum ? TWEET_TEXT_PLATINUM : TWEET_TEXT
  const encodedText = encodeURIComponent(text)
  const tweetUrl = `https://twitter.com/intent/tweet?url=${permalink}&text=${encodedText}`
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${permalink}`
  const downloadUrl = `https://obuldanrptloktxcffvn.supabase.co/functions/v1/lw11-og?username=${encodeURIComponent(
    username ?? ''
  )}`
  const params = useParams()
  const sharePage = !!params.username
  const LW_TABLE = 'lw11_tickets'

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
        await supabase
          .from(LW_TABLE)
          .update({
            sharedOnTwitter: 'now',
            metadata: { ...metadata, hasSharedSecret: hasSecretTicket },
          })
          .eq('username', username)
        // window.open(tweetUrl, '_blank')
      } else if (social === 'linkedin') {
        await supabase
          .from(LW_TABLE)
          .update({
            sharedOnLinkedIn: 'now',
            metadata: { ...metadata, hasSharedSecret: hasSecretTicket },
          })
          .eq('username', username)
        // window.open(linkedInUrl, '_blank')
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
      <div className="flex w-full gap-2">
        <Button
          onClick={() => handleShare('twitter')}
          type={userData.sharedOnTwitter ? 'secondary' : 'default'}
          icon={<IconTwitterX className="text-light w-3 h-3" />}
          size={isTablet ? 'tiny' : 'tiny'}
          block
          asChild
        >
          <Link href={tweetUrl} target="_blank">
            Share on X
          </Link>
        </Button>
        <Button
          onClick={() => handleShare('linkedin')}
          type={userData.sharedOnLinkedIn ? 'secondary' : 'default'}
          icon={<IconLinkedinSolid className="text-light w-3 h-3" />}
          size={isTablet ? 'tiny' : 'tiny'}
          block
          asChild
        >
          <Link href={linkedInUrl} target="_blank">
            Share on Linkedin
          </Link>
        </Button>
      </div>
    </div>
  )
}
