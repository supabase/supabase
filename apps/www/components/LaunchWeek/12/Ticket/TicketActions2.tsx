import { useEffect, useRef, useState } from 'react'
import dayjs from 'dayjs'
import NextImage from 'next/image'
import Link from 'next/link'
import { LW_URL, TWEET_TEXT, TWEET_TEXT_PLATINUM, TWEET_TEXT_SECRET } from '~/lib/constants'
import { Button, cn, IconCheck } from 'ui'
import { useParams } from '~/hooks/useParams'
import LaunchWeekPrizeCard from '../LaunchWeekPrizeCard'
import TicketCopy from './TicketCopy'
import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'

export default function TicketActions2() {
  const { userData, supabase } = useConfData()
  const { platinum, username, metadata, secret: hasSecretTicket } = userData
  const [_imgReady, setImgReady] = useState(false)
  const [_loading, setLoading] = useState(false)
  const downloadLink = useRef<HTMLAnchorElement>()
  const link = `${LW_URL}/tickets/${username}?lw=12${
    hasSecretTicket ? '&secret=true' : platinum ? `&platinum=true` : ''
  }&t=${dayjs(new Date()).format('DHHmmss')}`
  const permalink = encodeURIComponent(link)
  const text = hasSecretTicket ? TWEET_TEXT_SECRET : platinum ? TWEET_TEXT_PLATINUM : TWEET_TEXT
  const encodedText = encodeURIComponent(text)
  const tweetUrl = `https://twitter.com/intent/tweet?url=${permalink}&text=${encodedText}`
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${permalink}&text=${encodedText}`
  const downloadUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/lw12-og?username=${encodeURIComponent(
    username ?? ''
  )}`
  const params = useParams()
  const sharePage = !!params.username
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
    if (!supabase) return

    setTimeout(async () => {
      if (social === 'twitter') {
        await supabase
          .from(TICKETS_TABLE)
          .update({
            shared_on_twitter: 'now',
            metadata: { ...metadata, hasSharedSecret: hasSecretTicket },
          })
          .eq('launch_week', 'lw12')
          .eq('username', username)
      } else if (social === 'linkedin') {
        await supabase
          .from(TICKETS_TABLE)
          .update({
            shared_on_linkedin: 'now',
            metadata: { ...metadata, hasSharedSecret: hasSecretTicket },
          })
          .eq('launch_week', 'lw12')
          .eq('username', username)
      }

      if (userData.shared_on_linkedin && userData.shared_on_twitter) {
        await fetch(`/api-v2/ticket-og?username=${username}&platinum=true`)
      }
    })
  }

  return (
    <div className="flex flex-col gap-4 ">
      {/* <LabelBadge text="5 sets" /> */}
      {/* <p className="text-foreground-light text-sm">
        Boost your chances of winning Supabase LW12 Wandrd backpack and other awards.
      </p> */}
      <div
        className={cn(
          'w-full gap-2 flex flex-col items-center',
          sharePage ? 'justify-center' : 'justify-between'
        )}
      >
        <div className="flex flex-row flex-wrap justify-center w-full gap-2">
          <Button
            type="secondary"
            size="small"
            className="px-2 lg:px-3.5 h-[28px] lg:h-[34px] opacity-50"
            disabled
            icon={<IconCheck strokeWidth={3} />}
          >
            Ticket claimed
          </Button>
          <Button
            onClick={() => handleShare('twitter')}
            type={userData.shared_on_twitter ? 'secondary' : 'default'}
            icon={userData.shared_on_twitter && <IconCheck strokeWidth={3} />}
            size="small"
            className="px-2 lg:px-3.5 h-[28px] lg:h-[34px]"
            asChild
          >
            <Link href={tweetUrl} target="_blank">
              {userData.shared_on_twitter ? 'Shared on Twitter' : 'Share on Twitter'}
            </Link>
          </Button>
          <Button
            onClick={() => handleShare('linkedin')}
            type={userData.shared_on_linkedin ? 'secondary' : 'default'}
            icon={userData.shared_on_linkedin && <IconCheck strokeWidth={3} />}
            size="small"
            className="px-2 lg:px-3.5 h-[28px] lg:h-[34px]"
            asChild
          >
            <Link href={linkedInUrl} target="_blank">
              {userData.shared_on_linkedin ? 'Shared on Linkedin' : 'Share on Linkedin'}
            </Link>
          </Button>
        </div>{' '}
      </div>
    </div>
  )
}
