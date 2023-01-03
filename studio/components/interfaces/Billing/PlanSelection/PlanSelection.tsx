import Link from 'next/link'
import { FC } from 'react'
import { Transition } from '@headlessui/react'

import Plans from './Plans/Plans'
import { formatTierOptions } from './PlanSelection.utils'

interface Props {
  visible: boolean
  tiers: any[]
  currentPlan?: any
  onSelectPlan: (plan: any) => void
}

const PlanSelection: FC<Props> = ({ visible, tiers, currentPlan, onSelectPlan }) => {
  const formattedTiers = formatTierOptions(tiers)

  // [Kevin] TODO Remove after team plan is generally available
  const gridCols = formattedTiers.length === 3 ? 'gap-8 xl:grid-cols-3' : 'gap-4 xl:grid-cols-4'

  return (
    <Transition
      show={visible}
      enter="transition ease-out duration-300"
      enterFrom="transform opacity-0 -translate-x-10"
      enterTo="transform opacity-100 translate-x-0"
    >
      <div>
        <h4 className="text-lg mb-8">Change your project's subscription</h4>
        <div className={`grid py-8 grid-cols-2 ${gridCols}`}>
          <Plans plans={formattedTiers} currentPlan={currentPlan} onSelectPlan={onSelectPlan} />
        </div>
        <div className="flex justify-center items-center mt-4">
          <Link href="https://supabase.com/pricing">
            <a
              target="_blank"
              className="text-sm underline text-scale-1100 hover:text-scale-1200 transition"
            >
              See detailed comparisons across plans
            </a>
          </Link>
        </div>
      </div>
    </Transition>
  )
}

export default PlanSelection
