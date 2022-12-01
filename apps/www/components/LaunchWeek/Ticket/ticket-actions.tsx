import { useEffect, useRef, useState } from 'react'
import { SITE_URL, TWEET_TEXT, TWEET_TEXT_GOLDEN } from '~/lib/constants'
import { IconDownload, IconLinkedin, IconTwitter } from 'ui'
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
  const downloadUrl = `https://obuldanrptloktxcffvn.functions.supabase.co/launchweek-ticket-og?username=${encodeURIComponent(
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

  const ActionStyle = ({ children }: any) => {
    return (
      <div className="rounded-full bg-white dark:bg-scale-400 dark:hover:bg-scale-500 py-1 px-3 border border-scale-500 dark:text-white text-sm mb-1 transition-all ease-out hover:bg-scale-500">
        {children}
      </div>
    )
  }

  return (
    <>
      <ActionStyle>
        <a
          href={tweetUrl}
          rel="noopener noreferrer"
          target="_blank"
          className="flex items-center gap-2"
        >
          <div className="text-scale-900">
            <IconTwitter size={12} strokeWidth={1.5} />
          </div>
          Tweet it
        </a>
      </ActionStyle>
      <ActionStyle>
        <a
          href={linkedInUrl}
          rel="noopener noreferrer"
          target="_blank"
          className="flex items-center gap-2"
        >
          <div className="text-scale-900">
            <IconLinkedin size={12} strokeWidth={1.5} />
          </div>
          Share on Linkedin
        </a>
      </ActionStyle>
      <ActionStyle>
        <a
          href={loading ? undefined : downloadUrl}
          onClick={(e) => {
            if (imgReady) return

            e.preventDefault()
            downloadLink.current = e.currentTarget
            // Wait for the image download to finish
            setLoading(true)
          }}
          download="ticket.png"
          className="flex items-center gap-2"
        >
          <div className="text-scale-900">
            <IconDownload size={12} strokeWidth={1.5} />
          </div>
          Download
          {loading ? <LoadingDots size={4} /> : <>{/* <IconDownload width={24} /> Download */}</>}
        </a>
      </ActionStyle>
    </>
  )
}
