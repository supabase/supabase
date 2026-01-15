export function EventTimeline() {
  return (
    <div className="relative hidden md:flex h-full w-full py-2 flex-col items-center gap-y-8">
      <div
        className="absolute h-full w-px border-[0.5px] border-dashed left-1/2 -translate-x-1/2"
        style={{
          maskImage:
            'linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 1) 97%, rgba(0, 0, 0, 0) 100%)',
        }}
      />
    </div>
  )
}
