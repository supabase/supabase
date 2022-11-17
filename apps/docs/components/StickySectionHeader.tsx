import { FC } from 'react'
interface Props {
  title: string
}

// TODO — need the sticky header intersection observer stuff next
const StickySectionHeader: FC<Props> = ({ title }) => {
  return (
    <>
      <header className="sticky top-14 bg-white dark:bg-blackA-300 z-10 p-4">
        <h2 className="text-3xl not-prose">{title}</h2>
      </header>
    </>
  )
}

export default StickySectionHeader
