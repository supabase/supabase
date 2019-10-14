export default function Footer() {
  return (
    <form className="field is-grouped" name="contact" method="POST" data-netlify="true">
      <p className="control is-expanded">
        <input className="input" type="email" name="email" placeholder="your@email.com" />
      </p>
      <p className="control">
        <button className="button is-primary" type="submit">
          Early Sign Up
        </button>
      </p>
    </form>
  )
}
