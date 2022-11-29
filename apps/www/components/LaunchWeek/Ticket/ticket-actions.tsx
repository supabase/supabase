import { useState, useRef, useEffect } from 'react'
import cn from 'classnames'
import { SITE_URL, TWEET_TEXT, TWEET_TEXT_GOLDEN } from '~/lib/constants'
// import IconTwitter from '~/components/LaunchWeek/Ticket/icons/icon-twitter'
// import IconLinkedin from '~/components/LaunchWeek/Ticket/icons/icon-linkedin'
// import IconDownload from '~/components/LaunchWeek/Ticket/icons/icon-download'
import LoadingDots from './loading-dots'
import styleUtils from './utils.module.css'
import styles from './ticket-actions.module.css'
import useConfData from '~/components/LaunchWeek/Ticket//hooks/use-conf-data'

type Props = {
  username: string
  golden?: boolean
}

export default function TicketActions({ username, golden = false }: Props) {
  const [imgReady, setImgReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const downloadLink = useRef<HTMLAnchorElement>()
  const permalink = encodeURIComponent(`${SITE_URL}/tickets/${username}`)
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

  return (
    <>
      <a
        className={cn(styles.button, styleUtils.appear, styles.first, 'icon-button')}
        href={tweetUrl}
        rel="noopener noreferrer"
        target="_blank"
      >
        {/* <IconTwitter width={24} /> Tweet it! */}
      </a>
      <a
        className={cn(
          styles.button,
          styleUtils.appear,
          styles.second,
          'icon-button',
          // LinkedIn Share widget doesn’t work on mobile
          styles['linkedin-button']
        )}
        href={linkedInUrl}
        rel="noopener noreferrer"
        target="_blank"
      >
        {/* <IconLinkedin width={20} /> Share on LinkedIn */}
      </a>
      <a
        className={cn(styles.button, styleUtils.appear, styles.third, 'icon-button', {
          [styles.loading]: loading,
        })}
        href={loading ? undefined : downloadUrl}
        onClick={(e) => {
          if (imgReady) return

          e.preventDefault()
          downloadLink.current = e.currentTarget
          // Wait for the image download to finish
          setLoading(true)
        }}
        download="ticket.png"
      >
        {loading ? <LoadingDots size={4} /> : <>{/* <IconDownload width={24} /> Download */}</>}
      </a>
    </>
  )
}
