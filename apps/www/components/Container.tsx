import { PropsWithChildren } from 'react'

type Props = {}

const Container = ({ children }: PropsWithChildren<Props>) => {
  return <div>{children}</div>
}

export default Container
