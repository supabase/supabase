export function LaunchWeekLogoHeader() {
  return (
    <div className="flex flex-col gap-1 md:gap-2 items-center justify-end">
      <div className="opacity-0 !animate-[fadeIn_0.5s_cubic-bezier(0.25,0.25,0,1)_0.5s_both] px-2 flex flex-col items-center text-center gap-3">
        <h1 className="sr-only font-normal uppercase text-[28px] sm:text-[32px]">Launch week 8</h1>
        <p className="text-white radial-gradient-text-600 text-lg sm:text-2xl">
          <span className="block">August 7th–11th, 2023</span>
        </p>
        <div className="text-[#9296AA]">
          <p>A week of announcing new features has come to an end.</p>
          <p>Thanks to everyone who participated.</p>
        </div>
      </div>
    </div>
  )
}
