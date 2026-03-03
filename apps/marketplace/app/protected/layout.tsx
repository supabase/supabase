import { redirect } from 'next/navigation'
import { SidebarProvider } from 'ui'

import { AppSidebar } from '@/components/app-sidebar'
import { LayoutHeader } from '@/components/layout-header'
import { getMarketplaceSidebarData } from '@/lib/marketplace/server'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, partners } = await getMarketplaceSidebarData()

  if (!user) {
    redirect('/auth/login')
  }

  if (partners.length === 0) {
    redirect('/partners/new')
  }

  return (
    <SidebarProvider>
      <div className="flex h-svh w-full flex-col">
        <LayoutHeader
          partners={partners.map((partner) => ({
            slug: partner.slug,
            title: partner.title,
          }))}
          user={{
            email: user.email,
            fullName: user.user_metadata?.full_name ?? user.user_metadata?.name,
            avatarUrl: user.user_metadata?.avatar_url,
          }}
        />
        <div className="flex min-h-0 flex-1">
          <AppSidebar partners={partners} className="h-full" />
          <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
