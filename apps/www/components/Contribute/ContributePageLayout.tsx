import DefaultLayout from '~/components/Layouts/Default'
import { BackToThreadsLink } from '~/components/Contribute/BackToThreadsLink'
import { ContributeGuard } from '~/app/contribute/ContributeGuard'

export function ContributePageLayout({ children }: { children: React.ReactNode }) {
  return (
    <ContributeGuard>
      <DefaultLayout>
        <main className="min-h-screen flex flex-col items-center">
          <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-16">
            <BackToThreadsLink />
            {children}
          </div>
        </main>
      </DefaultLayout>
    </ContributeGuard>
  )
}
