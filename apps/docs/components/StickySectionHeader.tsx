import { FC } from 'react'
interface Props {
  title: string
  id: string
}

// TODO — need the sticky header intersection observer stuff next
// when the header is sticky, we need to grab the matching item in the sidebar
const StickySectionHeader: FC<Props> = ({ title, id }) => {
  console.log(id)
  return (
    <>
      <header className="sticky top-14 bg-white dark:bg-blackA-300 z-10 p-4">
        <h2 className="text-3xl not-prose">{title}</h2>
      </header>
    </>
  )
}

export default StickySectionHeader
