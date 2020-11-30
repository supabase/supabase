import Button from '../button'

const CTABanner = () => {
	return (
		<div className="py-32 grid grid-cols-12 gap-4 items-center text-center bg-gray-100 dark:bg-dark-700">
			<div className="col-span-12">
				<h4 className="font-normal text-gray-900 dark:text-white lg:text-3xl">
					<span className="block">Create your next project backend </span>
				</h4>
				<p className="font-normal mt-1 text-gray-500 lg:text-3xl">
					Create your next project backend in less than 2 minutes
				</p>
			</div>
			<div className="col-span-12">
				<Button text="Create a new project" url="#" />
			</div>
		</div>
	)
}

export default CTABanner