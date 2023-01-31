import Link from 'next/link'
import { FC } from 'react'
import { Transition } from '@headlessui/react'

import PlanCard from './Plans/PlanCard'
import { formatTierOptions } from './PlanSelection.utils'
import { Button, IconExternalLink } from 'ui'

interface Props {
  visible: boolean
  tiers: any[]
  currentPlan?: any
  onSelectPlan: (plan: any) => void
}

const PlanSelection: FC<Props> = ({ visible, tiers, currentPlan, onSelectPlan }) => {
  const formattedTiers = formatTierOptions(tiers)

  // [Kevin] TODO Remove after team plan is generally available
  const gridCols =
    formattedTiers.length === 3
      ? 'gap-8 lg:grid-cols-3'
      : 'gap-4 lg:grid-cols-3 xl:grid-cols-billingWithTeam'

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
          {formattedTiers.map((plan) => {
            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                currentPlan={currentPlan}
                onSelectPlan={() => onSelectPlan(plan)}
              />
            )
          })}
        </div>
        <div className="flex justify-center items-center mt-4">
          <Link href="https://supabase.com/pricing">
            <a target="_blank">
              <Button
                type="link"
                icon={<IconExternalLink size={14} strokeWidth={1.5} />}
                className="text-sm text-scale-1000 hover:text-scale-1100 hover:bg-scale-400"
              >
                See detailed comparisons across plans
              </Button>
            </a>
          </Link>
        </div>
      </div>
    </Transition>
  )
}

export default PlanSelection
