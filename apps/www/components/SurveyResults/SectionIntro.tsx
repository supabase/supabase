export function SectionIntro({
  title,
  description,
  text,
}: {
  title: string
  description: string
  text: string
}) {
  return (
    <div className="max-w-2xl text-center flex flex-col  gap-4">
      <h2 className="heading-gradient text-3xl sm:text-3xl xl:text-5xl text-balance">{title}</h2>
      <h3 className="heading-gradient text-lg sm:text-xl xl:text-2xl text-balance">
        {description}
      </h3>
      <p className="mx-auto text-foreground-lighter w-full">{text}</p>
    </div>
  )
}
