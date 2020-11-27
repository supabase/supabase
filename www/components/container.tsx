import { ReactNode, FunctionComponent } from 'react'

type Props = {
  children?: ReactNode
}

const Container: FunctionComponent = ({ children }: Props) => {
  return <div className="container mx-auto border-r-2 border-l-2 border-gray-50">
    {children}
  </div>
}

export default Container
