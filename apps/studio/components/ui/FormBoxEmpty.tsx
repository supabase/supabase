import { ReactText } from 'react'

interface Props {
  icon: JSX.Element
  text: ReactText
}

const FormBoxEmpty = ({ icon, text }: Props) => {
  return (
    <div className="flex items-center justify-center flex-row py-4 space-x-2">
      <div className="relative bg-surface-100 text-foreground-lighter w-6 h-6 rounded-full flex items-center justify-center">
        {icon}
      </div>
      <p className="text-foreground-light">{text}</p>
    </div>
  )
}

export default FormBoxEmpty
