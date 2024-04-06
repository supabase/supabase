import React from 'react'
import RefSubLayout from '~/layouts/ref/RefSubLayout'

interface Props {}

const RefHeaderSection: React.FC<React.PropsWithChildren<Props>> = (props) => {
  return (
    <>
      <RefSubLayout.EducationRow>
        <RefSubLayout.Details>{props.children}</RefSubLayout.Details>
      </RefSubLayout.EducationRow>
    </>
  )
}

export default RefHeaderSection
