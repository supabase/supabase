import { ContributePageLayout } from '~/components/Contribute/ContributePageLayout'

export default function Loading() {
  return (
    <ContributePageLayout>
      <div className="border border-border rounded-lg p-8 text-center text-muted-foreground bg-surface-200">
        Loading user profile...
      </div>
    </ContributePageLayout>
  )
}
