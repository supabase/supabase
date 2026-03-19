import { useBreakpoint } from 'common'
import dayjs from 'dayjs'
import { Check } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Button } from 'ui'
import useConfData from '../hooks/use-conf-data'
import { LW15_TWEET_TEXT, LW15_URL } from '~/lib/constants'
import supabase from '../supabase'

export default function LW15TicketShare() {
  const { resolvedTheme } = useTheme()
  const [state] = useConfData()
  const userData = state.userTicketData
  const { username, metadata } = userData
  const [_imgReady, setImgReady] = useState(false)
  const [_loading, setLoading] = useState(false)
  const isLessThanMd = useBreakpoint()
  const downloadLink = useRef<HTMLAnchorElement>()
  const link = `${LW15_URL}/tickets/${username}?lw=15&t=${dayjs(new Date()).format('DHHmmss')}`
  const permalink = encodeURIComponent(link)
  const text = LW15_TWEET_TEXT
  const encodedText = encodeURIComponent(text)
  const tweetUrl = `https://twitter.com/intent/tweet?url=${permalink}&text=${encodedText}`
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${permalink}&text=${encodedText}`
  const downloadUrl = `/api-v2/ticket-og?username=${encodeURIComponent(username ?? '')}`
  const TICKETS_TABLE = 'tickets'

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
    setTimeout(async () => {
      if (social === 'twitter') {
        await supabase
          .from(TICKETS_TABLE)
          .update({
            shared_on_twitter: 'now',
            metadata: { ...metadata, theme: resolvedTheme },
          })
          .eq('launch_week', 'lw15')
          .eq('username', username)
      } else if (social === 'linkedin') {
        await supabase
          .from(TICKETS_TABLE)
          .update({
            shared_on_linkedin: 'now',
            metadata: { ...metadata, theme: resolvedTheme },
          })
          .eq('launch_week', 'lw15')
          .eq('username', username)
      }

      if (userData.shared_on_linkedin && userData.shared_on_twitter) {
        await fetch(`/api-v2/ticket-og?username=${username}&platinum=true`)
      }
    })
  }

  return (
    <div className="flex flex-row flex-wrap justify-stretch w-full gap-1 pointer-events-auto">
      <Button
        onClick={() => handleShare('twitter')}
        type={userData.shared_on_twitter ? 'secondary' : 'default'}
        icon={userData.shared_on_twitter && <Check strokeWidth={2} />}
        size={isLessThanMd ? 'tiny' : 'small'}
        className="px-2 lg:px-3.5 h-[28px] lg:h-[34px] flex-1 w-full"
        asChild
      >
        <Link href={tweetUrl} target="_blank">
          {userData.shared_on_twitter ? 'Shared on Twitter' : 'Share on Twitter'}
        </Link>
      </Button>
      <Button
        onClick={() => handleShare('linkedin')}
        type={userData.shared_on_linkedin ? 'secondary' : 'default'}
        icon={userData.shared_on_linkedin && <Check strokeWidth={2} />}
        size={isLessThanMd ? 'tiny' : 'small'}
        className="px-2 lg:px-3.5 h-[28px] lg:h-[34px] flex-1 w-full"
        asChild
      >
        <Link href={linkedInUrl} target="_blank">
          {userData.shared_on_linkedin ? 'Shared on Linkedin' : 'Share on Linkedin'}
        </Link>
      </Button>
    </div>
  )
}
