import { useEffect, useState, useRef } from 'react'
import cn from 'classnames'
import { SITE_URL } from '~/lib/constants'
import styleUtils from './utils.module.css'
// import IconCopy from '~/components/LaunchWeek/Ticket/icons/icon-copy'
import styles from './ticket-copy.module.css'
import { IconCopy, IconCheck } from 'ui'

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

  console.log({ copied })

  const copiedText = <span className="absolute -right-2 text-xs">Copied!</span>

  // background: none;
  // outline: none;
  // border: none;
  // z-index: 2;
  // border-radius: var(--space-2x);
  // width: 40px;
  // display: flex;
  // align-items: center;
  // justify-content: center;
  // margin-right: -10px;

  const copyButton = (
    <button
      type="button"
      name="Copy"
      className="w-24 flex items-center -mr-4 cursor-pointer z-10"
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
      {copied ? <IconCheck /> : <IconCopy />}
    </button>
  )

  return (
    <div className={cn(styles.wrapper, styleUtils.appear)}>
      <div className="xs:flex gap-4 items-center max-w-md justify-between hidden sm:visible">
        <div className="font-bold">Your ticket URL:</div>
        <div
          className={cn(styles['mobile-copy'], {
            [styles['mobile-copy-disabled']]: !copyEnabled,
          })}
        >
          {copied && copiedText}
          {copyButton}
        </div>
      </div>
      <div className="xs:flex items-center ml-4 hidden sm:visible">
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
        <div className="relative">
          {copied && copiedText}
          {copyButton}
        </div>
      </div>
    </div>
  )
}
