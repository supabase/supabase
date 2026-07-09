import { redirect } from 'next/navigation'

import { BottomNav } from '@/components/bottom-nav'
import { QuickAddButton } from '@/components/quick-add/quick-add-button'
import { SignOutButton } from '@/components/sign-out-button'
import { getLeadOptions } from '@/lib/queries'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const leadOptions = await getLeadOptions()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur">
        <span className="text-base font-medium text-foreground">Sales Dashboard</span>
        <SignOutButton />
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="mx-auto w-full max-w-2xl px-4 py-4">{children}</div>
      </main>

      <QuickAddButton leadOptions={leadOptions} />
      <BottomNav />
    </div>
  )
}
