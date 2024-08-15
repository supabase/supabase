import Image from 'next/image'
import React, { useState } from 'react'
import CopyToClipboard from 'react-copy-to-clipboard'
import { IconCheck, IconCopy } from 'ui'

const LocalDXImage = () => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 1000)
  }

  return (
    <div className="relative w-full h-full flex-1 flex items-center justify-center">
      <Image
        src="/images/product/functions/grid-gradient-dark.svg"
        alt=""
        fill
        sizes="100%"
        aria-hidden
        draggable={false}
        className="object-cover absolute z-0 inset-0 hidden dark:block"
      />
      <Image
        src="/images/product/functions/grid-gradient-light.svg"
        alt=""
        fill
        sizes="100%"
        aria-hidden
        draggable={false}
        className="object-cover absolute z-0 inset-0 dark:hidden block"
      />
      <CopyToClipboard text="supabase functions serve <function-name>">
        <button
          onClick={handleCopy}
          className="p-3 relative z-10 group hover:border-strong flex gap-2 xl:gap-4 items-center bg-alternative-200 rounded-xl border"
        >
          <div className="text-foreground-muted text-sm font-mono">$</div>
          <div className="text-foreground text-sm font-mono">supabase functions serve</div>
          <div className="text-foreground rounded p-1.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {copied ? (
              <span className="text-brand">
                <IconCheck className="w-3.5 h-3.5" />
              </span>
            ) : (
              <IconCopy className="w-3.5 h-3.5" />
            )}
          </div>
        </button>
      </CopyToClipboard>
    </div>
  )
}
export default LocalDXImage
