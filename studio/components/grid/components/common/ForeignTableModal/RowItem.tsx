import * as React from 'react'
import { Menu } from 'ui'
import { Dictionary } from '../../../types'

interface RowItemProps {
  item: Dictionary<any>
  onSelect: (item: Dictionary<any>) => void
  columnNames: string[]
}

export const RowItem: React.FC<RowItemProps> = ({ item, onSelect, columnNames }) => {
  return (
    <div className="foreign-table-modal__row-item">
      <Menu.Item onClick={() => onSelect(item)} style={{ minWidth: 'min-content' }}>
        <div className="foreign-table-modal__row-item__inner">
          {columnNames.map((key, j) => {
            //
            // limit to 5 attributes
            //
            // this could be improved so the user could pick which attributes to display
            // @mildtomato
            if (j > 5) return null

            return (
              <div className="foreign-table-modal__row-item__inner__key-item" key={`item-${j}`}>
                <p className="foreign-table-modal__row-item__inner__key-item__key text-sm text-scale-1000">
                  {key}
                </p>
                <p className="text-sm font-bold">
                  {item[key]
                    ? typeof item[key] === 'object'
                      ? JSON.stringify(item[key])
                      : item[key]
                    : '[null]'}
                </p>
              </div>
            )
          })}
        </div>
      </Menu.Item>
    </div>
  )
}
