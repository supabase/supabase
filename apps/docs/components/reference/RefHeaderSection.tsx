import { PropsWithChildren } from 'react'
import RefSubLayout from '~/layouts/ref/RefSubLayout'

export interface RefHeaderSectionProps {}

const RefHeaderSection = ({ children }: PropsWithChildren<RefHeaderSectionProps>) => {
  return (
    <RefSubLayout.EducationRow>
      <RefSubLayout.Details>{children}</RefSubLayout.Details>
    </RefSubLayout.EducationRow>
  )
}

export default RefHeaderSection
