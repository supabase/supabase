import * as currentNavItems from '~/components/Navigation/NavigationMenu/NavigationMenu.constants'
import { IA_NAV_FLAG, isIaNavVariant, type IaNavVariant } from '~/features/IaNav/constants'
import { buildNavTree, type NavTree } from '~/features/IaNav/navTree'
import * as option1NavItems from '~/features/IaNav/option1.constants'
import { type NextRequest } from 'next/server'

const TREES: Record<IaNavVariant, NavTree> = {
  control: buildNavTree('today', currentNavItems),
  'option-1': buildNavTree('option-1', option1NavItems),
}

export function GET(request: NextRequest) {
  const variant = request.nextUrl.searchParams.get(IA_NAV_FLAG)
  return Response.json(TREES[isIaNavVariant(variant) ? variant : 'control'])
}
