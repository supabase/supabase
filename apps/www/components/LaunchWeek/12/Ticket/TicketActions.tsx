import NextImage from 'next/image'

export default function TicketActions() {
  return (
    <div className="bg-surface-75 border border-muted w-full h-auto grid sm:grid-cols-3 rounded-lg overflow-hidden sm:gap-3 items-center">
      <div className="relative flex items-center justify-center h-auto w-full object-center border-muted overflow-hidden">
        <NextImage
          src="/images/launchweek/12/lw12-backpack-crop.png"
          alt="Supabase LW12 Wandrd backpack"
          draggable={false}
          width={300}
          height={300}
          className="object-top mx-auto inset-x-0 w-auto h-full opacity-90 dark:opacity-50 pointer-events-none"
        />
      </div>
      <p className="sm:col-span-2 text-foreground-light text-sm sm:text-left p-4 sm:pl-0 w-auto border-t sm:border-none">
        Share your ticket to increase your chances of winning a{' '}
        <a
          href="https://www.wandrd.com/products/prvke?variant=39289416089680"
          target="_blank"
          className="text-foreground hover:text-brand transition"
        >
          Wandrd backpack
        </a>{' '}
        and other limited swag.
      </p>
    </div>
  )
}
