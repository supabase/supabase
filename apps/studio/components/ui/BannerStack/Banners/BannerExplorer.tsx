import { LOCAL_STORAGE_KEYS } from 'common'
import { AnimatePresence, motion } from 'framer-motion'
import { Badge, Button } from 'ui'

import { BannerCard } from '../BannerCard'
import { useBannerStack } from '../BannerStackProvider'
import { useFeaturePreviewModal } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useTrack } from '@/lib/telemetry/track'

export const BannerExplorer = () => {
  const track = useTrack()
  const { dismissBanner } = useBannerStack()
  const { selectFeaturePreview } = useFeaturePreviewModal()

  const [, setIsDismissed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.EXPLORER_BANNER_DISMISSED,
    false
  )

  return (
    <BannerCard
      onDismiss={() => {
        setIsDismissed(true)
        dismissBanner('explorer-banner')
        track('explorer_banner_dismiss_button_clicked')
      }}
    >
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-col gap-y-2 items-start w-full">
          <Badge variant="success" className="-ml-0.5 uppercase inline-flex items-center">
            Preview
          </Badge>
          <AnimatePresence>
            <div className="border h-27 w-full rounded-t-md mt-2 bg-surface-100 py-4 px-2 pb-0">
              <motion.div
                initial={{ opacity: 0, top: 10 }}
                animate={{ opacity: 1, top: 0 }}
                transition={{ delay: 0.5, duration: 0.2, ease: 'easeOut' }}
                className="w-[90%] mx-auto"
              >
                <p className="text-[10px]">User growth</p>
                <p className="text-[9px] text-foreground-lighter">
                  Track how your user base is trending.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, top: 10 }}
                animate={{ opacity: 1, top: 0 }}
                transition={{ delay: 1, duration: 0.2, ease: 'easeOut' }}
                className="w-full h-13.5 border border-b-0 mt-2 rounded-t bg-surface-200 overflow-hidden"
              >
                <div className="h-3 w-full border-b" />
                <p className="px-2 py-1 text-[8px] font-mono tracking-tighter flex flex-col">
                  <span className="text-code_block-1">select</span>
                  <span className="pl-2">date_trunc('week', last_sign_in_at) as week,</span>
                  <span className="pl-2">count(distinct id) as active_users</span>
                </p>
              </motion.div>
            </div>
          </AnimatePresence>
        </div>
        <div className="flex flex-col gap-y-1 mb-2">
          <p className="text-sm font-medium">Explorer & Notebooks</p>
          <p className="text-xs text-foreground-lighter text-balance">
            New unified workspace for querying data and chatting with Assistant.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            size="tiny"
            onClick={() => {
              selectFeaturePreview(LOCAL_STORAGE_KEYS.UI_PREVIEW_EXPLORER)
              track('explorer_banner_cta_button_clicked')
            }}
          >
            Enable Explorer
          </Button>
        </div>
      </div>
    </BannerCard>
  )
}
