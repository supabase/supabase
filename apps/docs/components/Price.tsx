interface PriceProps {
  children: React.ReactNode
}

export const Price: React.FC<PriceProps> = ({ children }) => {
  return <span translate="no">{children}</span>
}
