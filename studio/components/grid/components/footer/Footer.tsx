import * as React from 'react'
import Pagination from './pagination'

type FooterProps = {}

const Footer: React.FC<FooterProps> = () => {
  return (
    <div className="sb-grid-footer">
      <div className="sb-grid-footer__inner">
        <Pagination />
      </div>
    </div>
  )
}
export default Footer
