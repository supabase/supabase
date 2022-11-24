import { FC } from 'react'

interface ISectionContainer extends FC {
  id: string
}

type RefSubLayoutSubComponents = {
  Section: ISectionContainer
}

type RefSubLayoutType = {}

const RefSubLayout: React.FunctionComponent<RefSubLayoutType> & RefSubLayoutSubComponents = (
  props
) => {
  return (
    <div className="flex my-16">
      <div className="w-full">
        <div className="flex flex-col gap-32 mx-auto max-w-5xl">{props.children}</div>
      </div>
    </div>
  )
}

const Section: FC<ISectionContainer> = (props) => {
  return (
    <div className="grid grid-cols-2 ref-container gap-10" key={props.id} id={props.id}>
      {props.children}
    </div>
  )
}

// @ts-ignore // needs typing with FC type
RefSubLayout.Section = Section

export default RefSubLayout
