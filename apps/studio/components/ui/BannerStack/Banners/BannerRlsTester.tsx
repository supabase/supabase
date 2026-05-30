import { LOCAL_STORAGE_KEYS } from 'common'
import { useParams } from 'common/hooks'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Loader2, Terminal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge, Button, cn } from 'ui'

import { BannerCard } from '../BannerCard'
import { useBannerStack } from '../BannerStackProvider'
import { useFeaturePreviewModal } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

const text = 'select * from colors'

export const BannerRlsTester = () => {
  const { ref } = useParams()
  const { selectFeaturePreview } = useFeaturePreviewModal()

  const [runQueryAnimate, setRunQueryAnimate] = useState(false)
  const [showSummary, setShowSummary] = useState(false)

  const { dismissBanner } = useBannerStack()
  const [, setIsDismissed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.RLS_TESTER_BANNER_DISMISSED(ref ?? ''),
    false
  )

  useEffect(() => {
    setTimeout(() => setRunQueryAnimate(true), 2400)
  }, [])

  useEffect(() => {
    if (runQueryAnimate) {
      setTimeout(() => setShowSummary(true), 1700)
    }
  }, [runQueryAnimate])

  return (
    <BannerCard
      onDismiss={() => {
        setIsDismissed(true)
        dismissBanner('rls-tester-banner')
      }}
    >
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-col gap-y-2 items-start">
          <Badge variant="success" className="-ml-0.5 uppercase inline-flex items-center mb-2">
            Preview
          </Badge>

          <div className={cn('transition-all bg-surface-100 w-full border rounded-md')}>
            <div className="flex items-center gap-x-2 p-2">
              {runQueryAnimate && !showSummary ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Terminal size={12} />
              )}
              <p
                className="uppercase tracking-tight text-xs font-mono overflow-hidden whitespace-nowrap border-r-2 border-overlay"
                style={{
                  width: `${text.length}ch`,
                  animation: `typewriter 2s steps(${text.length}) forwards, blink-caret 0.75s step-end infinite`,
                }}
              >
                {text}
              </p>
            </div>

            <AnimatePresence>
              {showSummary && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: '50px' }}
                  exit={{ height: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 420,
                    damping: 30,
                    mass: 0.4,
                  }}
                  className="border-t text-xs p-2"
                >
                  <div className="flex items-center gap-x-2">
                    <Check size={12} strokeWidth={3} className="text-brand" />
                    <p>
                      Can access <code className="text-code-inline">public.colors</code>
                    </p>
                  </div>
                  <div>
                    <p className="text-foreground-light mt-0.5 ml-5">2 policies applied</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex flex-col gap-y-1 mb-2">
          <p className="text-sm font-medium">Row Level Security (RLS) Tester</p>
          <p className="text-xs text-foreground-lighter text-balance">
            Verify your RLS policies are correct by running queries as a specific user
          </p>
        </div>
        <Button
          type="default"
          className="w-min"
          onClick={() => selectFeaturePreview(LOCAL_STORAGE_KEYS.UI_PREVIEW_RLS_TESTER)}
        >
          Enable feature preview
        </Button>
      </div>
    </BannerCard>
  )
}
