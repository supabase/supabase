import { EmailTemplates, SmtpForm } from 'components/interfaces'
import { AuthLayout } from 'components/layouts'
import { FormsContainer } from 'components/ui/Forms'
import { useStore } from 'hooks'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => {
  const { ui, authConfig } = useStore()

  useEffect(() => {
    // temporary store loader
    authConfig.load()
  }, [ui.selectedProjectRef])

  if (authConfig) {
    return (
      <FormsContainer>
        <SmtpForm />
        <EmailTemplates />
      </FormsContainer>
    )
  } else {
    return <div />
  }
}

PageLayout.getLayout = (page) => {
  return <AuthLayout>{page}</AuthLayout>
}

export default observer(PageLayout)
