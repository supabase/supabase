import { Input } from '../Input'

export interface FloatingCommandProps {}

const FloatingCommand = ({}: FloatingCommandProps) => {
  return (
    <input
      ref={(el) => {
        // TODO: clean up
        console.log({ el })
        setTimeout(() => el?.focus(), 1000)
      }}
      autoFocus
      className="bg-scale-100 dark:bg-scale-300 border border-scale-300 dark:border-scale-900 rounded-md shadow-xl transition ease-out scale-100 p-4 outline-none w-full"
    />
  )
}

export default FloatingCommand
