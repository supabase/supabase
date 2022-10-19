import { Link } from 'remix'

export default function Index() {
  return (
    <>
      <h1>Index page</h1>
      <ul>
        <li>
          <Link to="/private">Go to private page</Link>
        </li>
        <li>
          <Link to="/private/profile">Go to private/profile page</Link>
        </li>
        <li>
          <Link to="/login">Go to login page</Link>
        </li>
      </ul>
    </>
  )
}
