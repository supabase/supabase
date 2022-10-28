import { getAnchor, removeAnchor } from './CustomMDX.utils'

const H3 = ({ children }) => {
  const anchor = getAnchor(children)
  const link = `#${anchor}`
  return (
    <h3 id={anchor} className="group">
      {removeAnchor(children)}
      {anchor && (
        <a href={link} className="opacity-0 group-hover:opacity-100 transition">
          #
        </a>
      )}
    </h3>
  )
}
export default H3
