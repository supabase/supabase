interface PriceProps {
  price: string
}

export const Price: React.FC<PriceProps> = ({ price }) => {
  return <span translate="no">${price}</span>
}
