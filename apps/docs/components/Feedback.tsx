import { AnimatePresence, motion } from 'framer-motion'
import { type MouseEvent, type PropsWithChildren, useRef, useState, } from 'react'

import { Button, IconCheck, IconX, cn } from 'ui'

type FeedbackButtonProps = {
	onClick: (e: MouseEvent) => void
}

function FeedbackButton({ children }: PropsWithChildren) {
	return (
		<AnimatePresence>
			<motion.button>{children}</motion.button>
		</AnimatePresence>
	)
}

function Feedback() {
	const [selected, setSelected] = useState<'yes' | 'no' | null>(null)
	const feedbackMessageRef = useRef<HTMLParagraphElement>(null)

	return (
		<div className="flex gap-2 items-center mb-2">
			{(!selected || selected === 'yes') && <Button
				type="outline"
				className={cn('px-1', selected === 'yes' && 'bg-green-500')}
				onClick={() => setSelected('yes')}
			>
				<IconCheck />
				<span className="sr-only">Yes</span>
			</Button>}
			{(!selected || selected === 'no') && <Button
				type="outline"
				className={cn('px-1', selected === 'no' && 'bg-red-500')}
				onClick={() => setSelected('no')}
			>
				<IconX />
				<span className="sr-only">No</span>
			</Button>}
			{selected && (
				<p ref={feedbackMessageRef} className="text-[0.8rem] text-foreground-lighter">
					{selected === 'no' ? <>How can we improve?</> : <>What went well?</>}
				</p>
			)}
		</div>
	)
}

export { Feedback }
