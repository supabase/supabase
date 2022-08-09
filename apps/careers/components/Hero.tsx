import Link from 'next/link'

const Hero = () => {
  return (
    <section className="hero" id="hero">
      <div className="mx-auto w-fit space-y-4 text-center">
        <h1 className="text-2xl font-bold md:text-4xl lg:text-5xl">
          Come build the home for <br /> all developers
        </h1>
        <p className="mx-auto w-5/6 text-sm md:w-4/6 md:text-base">
          Do the best work of your career and join in our mission to accelerate human progress by
          connecting communities all over the world through software collaboration.
        </p>
        <div className="mx-auto flex w-fit space-x-4">
          <Link href="#positions">
            <a className="text-brand-900">Open positions</a>
          </Link>
          <Link href="#positions">
            <a className="text-brand-900">Internships</a>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Hero
