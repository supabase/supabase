import MainLayout from '~/components/layouts/MainLayout'
import Link from 'next/link'
export default class Thanks extends React.Component {
  render() {
    return (
      <MainLayout>
        <div className="section container m-t-xxl m-b-xxl ">
          <div className="columns is-centered">
            <div className="column" style={{ maxWidth: 450 }}>
              <h1 className="title is-1">Thanks!</h1>
              <p className="subtitle">You're super early.</p>
              <p className="">We've put you on the early-bird list.</p>
              <p className="">
                If you're feeling really brave, why don't you check out our{' '}
                <Link href={`/docs/[category]/[slug]`} as={`/docs/-/about`}>
                  <a className="">docs</a>
                </Link>{' '}
                and start using our free &amp; opensource products?
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }
}
