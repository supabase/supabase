import { AnchorProvider, TocMenu } from 'ui-patterns/Toc'
import type { TOCItemType } from 'ui-patterns/Toc/types'

export interface TocHeaderMenuProps {
  items: TOCItemType[]
  className?: string
}

// the header is its own island, so it tracks the headings with its own AnchorProvider
export const TocHeaderMenu = ({ items, className }: TocHeaderMenuProps) => (
  <AnchorProvider toc={items} single={false}>
    <TocMenu items={items} className={className} />
  </AnchorProvider>
)
