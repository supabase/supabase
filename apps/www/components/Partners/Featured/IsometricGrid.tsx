export function IsometricGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 ![perspective:1000px]">
        <div
          className="absolute inset-0 w-[200%] h-[200%] -left-1/2 -top-1/2"
          style={{ transform: 'rotateX(75deg)' }}
        >
          <svg className="w-full h-full opacity-[0.15]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="partner-grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-brand"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#partner-grid)" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-background" />
    </div>
  )
}

