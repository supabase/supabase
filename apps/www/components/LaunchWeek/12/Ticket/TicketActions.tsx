import { useEffect, useRef, useState } from 'react'
import dayjs from 'dayjs'
import NextImage from 'next/image'
import Link from 'next/link'
import { LW_URL, TWEET_TEXT, TWEET_TEXT_PLATINUM, TWEET_TEXT_SECRET } from '~/lib/constants'
import { Button, cn } from 'ui'
import { useParams } from '~/hooks/useParams'
import LaunchWeekPrizeCard from '../LaunchWeekPrizeCard'
import TicketCopy from './TicketCopy'
import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'

export default function TicketActions() {
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
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${permalink}`
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
    })
  }

  return (
    <LaunchWeekPrizeCard
      className="col-span-full md:col-span-2"
      contentClassName="flex flex-col justify-between"
      content={
        <div className="w-full h-auto flex flex-col lg:flex-row rounded-lg overflow-hidden">
          <div className="relative flex items-center justify-center h-auto w-full lg:w-2/5 object-center border-b lg:border-none border-muted overflow-hidden">
            <NextImage
              src="/images/launchweek/12/lw12-backpack.png"
              alt="Supabase LW12 Wandrd backpack"
              draggable={false}
              width={300}
              height={300}
              className="hidden lg:block object-cover lg:object-top w-auto h-full opacity-90 dark:opacity-50 pointer-events-none"
            />
            <NextImage
              src="/images/launchweek/12/lw12-backpack-crop.png"
              alt="Supabase LW12 Wandrd backpack"
              draggable={false}
              width={300}
              height={300}
              className="lg:hidden object-cover lg:object-top mx-auto inset-x-0 w-auto h-full opacity-90 dark:opacity-50 pointer-events-none"
            />
          </div>
          <div className="flex flex-col gap-4 w-full lg:w-3/5 p-4 lg:p-8 lg:pl-0">
            {/* <LabelBadge text="5 sets" /> */}
            <p className="text-foreground text-sm">
              Boost your chances of winning Supabase LW12 Wandrd backpack and other awards.
            </p>
            <div
              className={cn(
                'w-full gap-2 flex flex-col items-center',
                sharePage ? 'justify-center' : 'justify-between'
              )}
            >
              <div className="flex flex-col w-full gap-2">
                <Button type="secondary" size="tiny" block disabled className="opacity-100">
                  Ticket claimed
                </Button>
                <Button
                  onClick={() => handleShare('twitter')}
                  type={userData.shared_on_twitter ? 'secondary' : 'default'}
                  // icon={<IconTwitterX className="text-light w-3 h-3" />}
                  size="tiny"
                  block
                  asChild
                >
                  <Link href={tweetUrl} target="_blank">
                    Share on X
                  </Link>
                </Button>
                <Button
                  onClick={() => handleShare('linkedin')}
                  type={userData.shared_on_linkedin ? 'secondary' : 'default'}
                  // icon={<IconLinkedinSolid className="text-light w-3 h-3" />}
                  size="tiny"
                  block
                  asChild
                >
                  <Link href={linkedInUrl} target="_blank">
                    Share on Linkedin
                  </Link>
                </Button>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-2 items-center justify-center w-full">
              <TicketCopy />
            </div>
          </div>
        </div>
      }
    />
  )
}
