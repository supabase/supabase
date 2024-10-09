import {
  ScaffoldContainer,
  ScaffoldDescription,
  ScaffoldHeader,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import { PropsWithChildren } from 'react'
import { Separator } from 'ui'
import ApiKeysNotice from 'components/ui/ApiKeysNotice'

const ApiKeysLayout = ({ children }: PropsWithChildren) => {
  return (
    <>
      <ScaffoldContainer>
        <ScaffoldHeader>
          <ScaffoldTitle>API Keys</ScaffoldTitle>
          <ScaffoldDescription>
            Configure API keys that help secure your project
          </ScaffoldDescription>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <ScaffoldContainer className="flex flex-col gap-10">
        <ApiKeysNotice />
      </ScaffoldContainer>
      <ScaffoldContainer className="flex flex-col gap-10 py-8" bottomPadding>
        <Separator />
        {children}
      </ScaffoldContainer>
    </>
  )
}

export default ApiKeysLayout
