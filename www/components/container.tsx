import { ReactNode, FunctionComponent } from 'react'
import Navigation from './navigation'

type Props = {
  children?: ReactNode
}

const Container: FunctionComponent = ({ children }: Props) => {
  return <div className="container mx-auto px-5">
    {children}
  </div>
}

export default Container
