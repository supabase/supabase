/**
 * Copyright 2020 Vercel Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useState, useRef, useEffect } from 'react'
import cn from 'classnames'
import { SITE_URL, TWEET_TEXT } from '~/lib/launchweek/constants'
import IconTwitter from '../icons/icon-twitter'
import IconLinkedin from '../icons/icon-linkedin'
import IconDownload from '../icons/icon-download'
import LoadingDots from '../loading-dots'
import styleUtils from '../utils.module.css'
import styles from './ticket-actions.module.css'

type Props = {
  username: string
}

export default function TicketActions({ username }: Props) {
  const [imgReady, setImgReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const downloadLink = useRef<HTMLAnchorElement>()
  const permalink = encodeURIComponent(`${SITE_URL}/tickets/${username}`)
  const text = encodeURIComponent(TWEET_TEXT)
  const tweetUrl = `https://twitter.com/intent/tweet?url=${permalink}&via=supabase&text=${text}`
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${permalink}`
  const downloadUrl = `/api/launchweek/ticket-images/${username}`

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
        <IconTwitter width={24} /> Tweet it!
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
        <IconLinkedin width={20} /> Share on LinkedIn
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
        {loading ? (
          <LoadingDots size={4} />
        ) : (
          <>
            <IconDownload width={24} /> Download
          </>
        )}
      </a>
    </>
  )
}
