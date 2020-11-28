import Button from '../button'

const CTABanner = () => {
	return (
		<div className="h-64 p-16 grid grid-cols-12 gap-4 items-center bg-gradient-to-r from-neutral-700 to-neutral-500">
			<div className="col-span-9">
				<h4 className="text-5xl font-normal text-white sm:text-2xl">
					<span className="block">Ready to get started?</span>
				</h4>
				<p className="text-2xl mt-1 text-gray-200">
					<span className="text-brand-600">Create your next project backend in less than 2 minutes.</span>
				</p>
			</div>
			<div className="col-span-3 text-right">
				<Button text="Create a new project" url="#" />
			</div>
		</div>
	)
}

export default CTABanner