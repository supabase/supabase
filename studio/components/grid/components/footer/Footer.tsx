import Pagination from './pagination'

export interface FooterProps {
  isLoading?: boolean
}

const Footer = ({ isLoading }: FooterProps) => {
  return (
    <div className="sb-grid-footer">
      <div className="sb-grid-footer__inner">
        <Pagination isLoading={isLoading} />
      </div>
    </div>
  )
}

export default Footer
