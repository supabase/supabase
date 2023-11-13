import Link from 'next/link'
import { useState } from 'react'
import { Button } from 'ui'

const PromoToast = () => {
  const [visible, setVisible] = useState(true)

  const handleHide = () => {
    setVisible(false)
    localStorage.setItem('supabase-hide-promo-toast', 'true')
  }
  const shouldShowToast = localStorage.getItem('supabase-hide-promo-toast') !== 'true'

  if (!visible || !shouldShowToast) {
    return null
  }

  return (
    <div className="grid gap-4 fixed bottom-8 right-8 bg-background p-8 shadow-md">
      <div className="text-foreground grid gap-2">
        <span className="text-xl">Launch Week X is coming!</span>
        <span className="text-lg"> Get your ticket</span>
        <span>Dec 11-15</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M5.7 21a2 2 0 0 1-3.5-2l8.6-14a6 6 0 0 1 10.4 6 2 2 0 1 1-3.464-2 2 2 0 1 0-3.464-2Z" />
          <path d="M17.75 7 15 2.1" />
          <path d="M10.9 4.8 13 9" />
          <path d="m7.9 9.7 2 4.4" />
          <path d="M4.9 14.7 7 18.9" />
        </svg>
      </div>

      <div className="flex items-center space-x-2">
        <Button type="text" onClick={handleHide}>
          Dismiss
        </Button>
        <Button asChild type="default">
          <Link target="_blank" rel="noreferrer" href="https://supabase.com/launch-week">
            Get your ticket
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default PromoToast
