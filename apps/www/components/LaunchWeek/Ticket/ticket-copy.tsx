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
  const scrollRef = useRef<HTMLParagraphElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const url = `${SITE_URL}/tickets/${username}`
  useEffect(() => {
    if (navigator.clipboard) {
      setCopyEnabled(true)
    }
  }, [])

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
      className="bg-[#E6E8EB] text-scale-500 text-xs w-21 flex items-center cursor-pointer py-1 px-2 rounded-lg"
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
      <div className="flex items-center gap-1 ">
        {copied ? (
          <>
            <IconCheck size={14} /> Copied!
          </>
        ) : (
          <>
            <IconCopy size={14} /> Copy your unique URL{' '}
          </>
        )}
      </div>
    </button>
  )

  return (
    <div
      className={cn(
        styleUtils.appear,
        styleUtils['appear-third'],
        'bg-scaleA-200 h-8 rounded-xl border border-scale-1100 w-full overflow-hidden'
      )}
      id="wayfinding--ticket-copy"
    >
      <div className="px-3 h-full flex items-center gap-3 w-full truncate relative pr-20 bg-[#D9D9D94D]">
        <div className="flex items-center truncate">
          <p
            className={['text-xs font-mono text-scale-1200 truncate'].join(' ')}
            ref={scrollRef}
            onScroll={() => {
              if (!scrolling) {
                setScrolling(true)
                const animationFrame = requestAnimationFrame(() => {
                  const scrollableWidth =
                    (scrollRef.current?.scrollWidth || 0) - (scrollRef.current?.clientWidth || 0)
                  setFadeOpacity(
                    (scrollableWidth - (scrollRef.current?.scrollLeft || 0)) /
                      (scrollableWidth || 1)
                  )
                  cancelAnimationFrame(animationFrame)
                  setScrolling(false)
                })
              }
            }}
          >
            {url}
          </p>
        </div>
        <div className="absolute right-1 with-auto height-auto flex items-center">{copyButton}</div>
      </div>
    </div>
  )
}
