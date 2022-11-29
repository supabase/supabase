import { useEffect, useState, useRef } from 'react'
import cn from 'classnames'
import { SITE_URL } from '~/lib/constants'
import styleUtils from './utils.module.css'
// import IconCopy from '~/components/LaunchWeek/Ticket/icons/icon-copy'
import styles from './ticket-copy.module.css'

type Props = {
  username: string
}

export default function TicketCopy({ username }: Props) {
  const [fadeOpacity, setFadeOpacity] = useState(1)
  const [scrolling, setScrolling] = useState(false)
  const [copyEnabled, setCopyEnabled] = useState(false)
  const [copied, setCopied] = useState(false)
  const scrollRef = useRef<HTMLSpanElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const url = `${SITE_URL}/tickets/${username}`
  useEffect(() => {
    if (navigator.clipboard) {
      setCopyEnabled(true)
    }
  }, [])

  const copiedText = (
    <span
      className={cn(styles.copied, {
        [styles.visible]: copied,
      })}
    >
      Copied!
    </span>
  )

  const copyButton = (
    <button
      type="button"
      className={styles['copy-button']}
      ref={buttonRef}
      onClick={() => {
        navigator.clipboard.writeText(url).then(() => {
          setCopied(true)
          setTimeout(() => {
            setCopied(false)
          }, 2000)
        })
      }}
    >
      {/* <IconCopy /> */}
    </button>
  )

  return (
    <div className={cn(styles.wrapper, styleUtils.appear)}>
      <div className={styles['label-wrapper']}>
        <div className={styles.label}>Your ticket URL:</div>
        <div
          className={cn(styles['mobile-copy'], {
            [styles['mobile-copy-disabled']]: !copyEnabled,
          })}
        >
          {copiedText}
          {copyButton}
        </div>
      </div>
      <div
        className={cn(styles.field, {
          [styles['desktop-copy-disabled']]: !copyEnabled,
        })}
      >
        <span
          className={styles.url}
          ref={scrollRef}
          onScroll={() => {
            if (!scrolling) {
              setScrolling(true)
              const animationFrame = requestAnimationFrame(() => {
                const scrollableWidth =
                  (scrollRef.current?.scrollWidth || 0) - (scrollRef.current?.clientWidth || 0)
                setFadeOpacity(
                  (scrollableWidth - (scrollRef.current?.scrollLeft || 0)) / (scrollableWidth || 1)
                )
                cancelAnimationFrame(animationFrame)
                setScrolling(false)
              })
            }
          }}
        >
          {url}
        </span>
        <span
          className={cn(styles.fade, {
            [styles['desktop-copy-disabled']]: !copyEnabled,
          })}
          style={{ opacity: fadeOpacity }}
        />
        <div
          className={cn(styles['desktop-copy'], styleUtils['hide-on-mobile'], {
            [styles['desktop-copy-disabled']]: !copyEnabled,
          })}
        >
          {copiedText}
          {copyButton}
        </div>
      </div>
    </div>
  )
}
