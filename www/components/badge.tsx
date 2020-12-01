const Badge = (props: any) => {
  return (
    <span className="ml-3 xl:ml-0 xl:mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
      <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-indigo-400" fill="currentColor" viewBox="0 0 8 8">
        <circle cx="4" cy="4" r="3" />
      </svg>
      {props.children}
    </span>
  )
}

export default Badge
