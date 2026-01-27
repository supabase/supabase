import { withAuth } from 'hooks/misc/withAuth'
import { PropsWithChildren } from 'react'

const WizardLayout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <div className="flex w-full flex-col">
      <div className="overflow-auto">
        <section className="has-slide-in slide-in relative mx-auto my-10 max-w-2xl">
          {children}
        </section>
      </div>
    </div>
  )
}

export default withAuth(WizardLayout)

export const WizardLayoutWithoutAuth = WizardLayout
