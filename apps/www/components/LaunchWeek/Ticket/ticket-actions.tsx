import { useEffect, useRef, useState } from 'react'
import { SITE_URL, TWEET_TEXT, TWEET_TEXT_GOLDEN } from '~/lib/constants'
import { IconCheckCircle, IconDownload, IconGitHub, IconLinkedin, IconTwitter } from 'ui'
import useConfData from '~/components/LaunchWeek/Ticket//hooks/use-conf-data'
import LoadingDots from './loading-dots'

type Props = {
  username: string
  golden?: boolean
}

export default function TicketActions({ username, golden = false }: Props) {
  const [imgReady, setImgReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const downloadLink = useRef<HTMLAnchorElement>()
  const permalink = encodeURIComponent(`${SITE_URL}/tickets/${username}?v=6`)
  const text = encodeURIComponent(golden ? TWEET_TEXT_GOLDEN : TWEET_TEXT)
  const { userData } = useConfData()
  const tweetUrl = `https://twitter.com/intent/tweet?url=${permalink}&via=supabase&text=${text}`
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${permalink}`
  const downloadUrl = `https://obuldanrptloktxcffvn.functions.supabase.co/lw7-ticket-og?username=${encodeURIComponent(
    userData.username ?? ''
  )}`

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
    <div className="grid gap-1">
      <div className="rounded-md bg-[#E6E8EB] text-scale-500 py-1 px-3 border border-scale-1100 text-xs mb-1 transition-all ease-out hover:bg-[#dfe1e3]">
        <a
          href={tweetUrl}
          rel="noopener noreferrer"
          target="_blank"
          className="flex items-center justify-center gap-2"
        >
          <div className="text-scale-900">
            <IconCheckCircle size={10} strokeWidth={1} />
          </div>
          Connect with Github
        </a>
      </div>
      <div
        className={`rounded-md ${
          userData.sharedOnTwitter ? 'bg-[#E6E8EB] text-scale-500' : 'text-white'
        }  text-scale-500 py-1 px-3 border border-scale-1100 text-xs mb-1 transition-all ease-out hover:bg-[#dfe1e3]`}
      >
        <a
          href={tweetUrl}
          rel="noopener noreferrer"
          target="_blank"
          className={`flex items-center justify-center gap-2 ${
            userData.sharedOnTwitter ? 'text-scale-500' : 'text-white hover:text-scale-500'
          }`}
        >
          {userData.sharedOnTwitter && (
            <div className="text-scale-900">
              <IconCheckCircle size={10} strokeWidth={1} />
            </div>
          )}
          Share on Twitter
        </a>
      </div>
      <div
        className={`rounded-md ${
          userData.sharedOnLinkedIn ? 'bg-[#E6E8EB] text-scale-500' : 'text-white'
        }  text-scale-500 py-1 px-3 border border-scale-1100 text-xs mb-1 transition-all ease-out hover:bg-[#dfe1e3]`}
      >
        <a
          href={linkedInUrl}
          rel="noopener noreferrer"
          target="_blank"
          className={`flex items-center justify-center gap-2 ${
            userData.sharedOnLinkedIn ? 'text-scale-500' : 'text-white hover:text-scale-500'
          }`}
        >
          {userData.sharedOnLinkedIn && (
            <div className="text-scale-900">
              <IconCheckCircle size={10} strokeWidth={1} />
            </div>
          )}
          Share on Linkedin
        </a>
      </div>
    </div>
  )
}
