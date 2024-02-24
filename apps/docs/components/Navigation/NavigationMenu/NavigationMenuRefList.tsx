import NavigationMenuRefListItems, { type RefMenuCategory } from './NavigationMenuRefListItems'
import { ActiveElemContext, useActiveElemController } from './utils'

interface NavigationMenuRefListProps {
  id: string
  menuData: Array<RefMenuCategory>
}

const NavigationMenuRefList = ({ id, menuData }: NavigationMenuRefListProps) => {
  const { ref, contextValueRef } = useActiveElemController()

  return (
    <ActiveElemContext.Provider value={contextValueRef.current}>
      <div
        ref={ref}
        className="transition-all duration-150 ease-out opacity-100 ml-0 delay-150 h-auto"
      >
        <NavigationMenuRefListItems id={id} menuData={menuData} />
      </div>
    </ActiveElemContext.Provider>
  )
}

export default NavigationMenuRefList
