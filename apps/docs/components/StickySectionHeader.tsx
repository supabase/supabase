import { FC } from 'react'
import { useInView } from 'react-intersection-observer'
interface Props {
  title: string
  id: string
}

function highlightMenuItem(item) {
  console.log(item)
}

// TODO — need the sticky header intersection observer stuff next
// when the header is sticky, we need to grab the matching item in the sidebar
const StickySectionHeader: FC<Props> = ({ title, id }) => {
  const { ref } = useInView({
    threshold: 1,
    onChange: (inView, entry) => {
      if (inView) highlightMenuItem(entry.target.id)
    },
  })

  return (
    <>
      <header ref={ref} className="sticky top-14 bg-white dark:bg-blackA-300 z-10 p-4" id={id}>
        <h2 className="text-3xl not-prose">{title}</h2>
      </header>
    </>
  )
}

export default StickySectionHeader
