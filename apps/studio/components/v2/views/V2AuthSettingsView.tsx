'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import type { NextPageWithLayout } from 'types'
import { Tabs_Shadcn_, TabsContent_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'

import { useV2Params } from '@/app/v2/V2ParamsContext'
import { BannerStackProvider } from '@/components/ui/BannerStack/BannerStackProvider'
import { StudioDataWorkspace } from '@/components/v2/data/StudioDataWorkspace'
import AuditLogsPage from '@/pages/project/[ref]/auth/audit-logs'
import HooksPage from '@/pages/project/[ref]/auth/hooks'
import MfaPage from '@/pages/project/[ref]/auth/mfa'
import OAuthServerPage from '@/pages/project/[ref]/auth/oauth-server'
import PerformancePage from '@/pages/project/[ref]/auth/performance'
import AuthPoliciesPage from '@/pages/project/[ref]/auth/policies'
import ProtectionPage from '@/pages/project/[ref]/auth/protection'
import RateLimitsPage from '@/pages/project/[ref]/auth/rate-limits'
import SessionsPage from '@/pages/project/[ref]/auth/sessions'
import SmtpPage from '@/pages/project/[ref]/auth/smtp'
import TemplatesPage from '@/pages/project/[ref]/auth/templates'
import ThirdPartyPage from '@/pages/project/[ref]/auth/third-party'
import UrlConfigurationPage from '@/pages/project/[ref]/auth/url-configuration'

const TABS: Array<{ key: string; label: string; content: NextPageWithLayout }> = [
  { key: 'url', label: 'URL', content: UrlConfigurationPage },
  { key: 'protection', label: 'Protection', content: ProtectionPage },
  { key: 'mfa', label: 'MFA', content: MfaPage },
  { key: 'sessions', label: 'Sessions', content: SessionsPage },
  { key: 'rate-limits', label: 'Rate limits', content: RateLimitsPage },
  { key: 'smtp', label: 'SMTP', content: SmtpPage },
  { key: 'templates', label: 'Templates', content: TemplatesPage },
  { key: 'policies', label: 'Policies', content: AuthPoliciesPage },
  { key: 'hooks', label: 'Hooks', content: HooksPage },
  { key: 'integrations', label: 'Integrations', content: ThirdPartyPage },
  { key: 'oauth-server', label: 'OAuth server', content: OAuthServerPage },
  { key: 'audit-logs', label: 'Audit logs', content: AuditLogsPage },
  { key: 'performance', label: 'Performance', content: PerformancePage },
]

const DEFAULT_TAB = TABS[0].key

export function V2AuthSettingsView() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { projectRef } = useV2Params()

  const tabParam = searchParams?.get('tab')
  const activeTab = TABS.some((t) => t.key === tabParam) ? (tabParam ?? DEFAULT_TAB) : DEFAULT_TAB

  const currentQuery = useMemo(
    () => new URLSearchParams(searchParams?.toString() ?? ''),
    [searchParams]
  )

  const onTabChange = (nextTab: string) => {
    currentQuery.set('tab', nextTab)
    router.replace(`${pathname}?${currentQuery.toString()}`, { scroll: false })
  }

  return (
    <StudioDataWorkspace projectRef={projectRef}>
      <div className="flex h-full min-h-0 flex-col">
        <Tabs_Shadcn_ value={activeTab} onValueChange={onTabChange}>
          <div className="sticky top-0 z-10 bg-background px-4 shrink-0">
            <TabsList_Shadcn_ className="h-auto bg-transparent p-0 gap-0 overflow-x-auto">
              {TABS.map((tab) => (
                <TabsTrigger_Shadcn_
                  key={tab.key}
                  value={tab.key}
                  className="relative rounded-none border-0 bg-transparent px-3 py-2.5 text-xs data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-transparent data-[state=active]:after:bg-foreground"
                >
                  {tab.label}
                </TabsTrigger_Shadcn_>
              ))}
            </TabsList_Shadcn_>
          </div>
          <BannerStackProvider>
            {TABS.map((tab) => {
              const Content = tab.content
              return (
                <TabsContent_Shadcn_ key={tab.key} value={tab.key} className="m-0">
                  <div className="hidden" />
                  <Content dehydratedState={undefined} />
                </TabsContent_Shadcn_>
              )
            })}
          </BannerStackProvider>
        </Tabs_Shadcn_>
      </div>
    </StudioDataWorkspace>
  )
}
