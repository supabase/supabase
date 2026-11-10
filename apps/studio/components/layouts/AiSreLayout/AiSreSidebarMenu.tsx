import { useGenerateAiSreMenu } from './AiSreMenu.utils'
import { ProductMenu } from '@/components/ui/ProductMenu'

interface AiSreSidebarMenuProps {
  page?: string
}

export function AiSreSidebarMenu({ page }: AiSreSidebarMenuProps) {
  const menu = useGenerateAiSreMenu()

  return (
    <div className="relative pb-12">
      <ProductMenu page={page} menu={menu} />
    </div>
  )
}
