import { X } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { useParams } from 'common'
import { LOCAL_STORAGE_KEYS } from 'common'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { BASE_PATH, DOCS_URL } from 'lib/constants'
import { Button, Badge, cn, Card, CardContent } from 'ui'
import { LOG_DRAIN_TYPES } from 'components/interfaces/LogDrains/LogDrains.constants'

export const ObservabilityBanner = () => {
  const { ref } = useParams()
  const [isDismissed, setIsDismissed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.OBSERVABILITY_BANNER_DISMISSED(ref ?? ''),
    false
  )
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.98 }}
          animate={isMounted ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 6, scale: 0.99 }}
          exit={{ opacity: 0, y: 6, scale: 0.99 }}
          transition={{
            duration: 0.3,
            ease: 'easeOut',
            delay: 0,
          }}
          className="fixed bottom-4 right-4 z-50 w-full max-w-80"
        >
          <Card className="relative overflow-hidden shadow-lg rounded-2xl">
            <div className="absolute -inset-16 z-0 opacity-50 pointer-events-none">
              <img
                src={`${BASE_PATH}/img/reports/bg-grafana-dark.svg`}
                alt="Background pattern"
                className="w-full h-full object-cover object-right hidden dark:block"
              />
              <img
                src={`${BASE_PATH}/img/reports/bg-grafana-light.svg`}
                alt="Background pattern"
                className="w-full h-full object-cover object-right dark:hidden"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background-alternative to-transparent" />
            </div>

            <CardContent className="relative z-10 p-6">
              <div className="absolute top-4 right-4 z-20">
                <Button
                  type="text"
                  size="tiny"
                  htmlType="button"
                  icon={<X size={16} strokeWidth={1.5} />}
                  onClick={(e) => {
                    e.preventDefault()
                    setIsDismissed(true)
                  }}
                  className="opacity-75 hover:opacity-100 px-1"
                  aria-label="Close banner"
                />
              </div>

              <div className="flex flex-col gap-y-4">
                <div className="flex flex-col gap-y-2 items-start">
                  <Badge
                    variant="success"
                    className="-ml-0.5 uppercase inline-flex items-center mb-2"
                  >
                    Beta
                  </Badge>
                  <div className="flex items-center gap-4">
                    {LOG_DRAIN_TYPES.filter((type) => type.value !== 'sentry').map((type) => (
                      <React.Fragment key={type.value}>
                        {React.cloneElement(type.icon, { height: 20, width: 20 })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-y-1 mb-2">
                  <p className="text-base font-medium">Export Metrics to your dashboards</p>
                  <p className="text-sm text-foreground-lighter text-balance">
                    Visualize over 200 database performance and health metrics with our Metrics API.
                  </p>
                </div>
                <ObservabilityBannerActions />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const ObservabilityBannerActions = ({ className }: { className?: string }) => {
  const { ref } = useParams()
  const { data: org } = useSelectedOrganizationQuery()
  const { mutate: sendEvent } = useSendEventMutation()

  return (
    <div className={cn('flex gap-2', className)}>
      <Button type="default" size="tiny" asChild>
        <Link
          href={`${DOCS_URL}/guides/telemetry/metrics`}
          target="_blank"
          onClick={() =>
            sendEvent({
              action: 'observability_metrics_api_banner_clicked',
              groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
            })
          }
        >
          Get started for Free
        </Link>
      </Button>
    </div>
  )
}
