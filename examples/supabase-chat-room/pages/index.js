import Router from 'next/router'
import cookie from 'js-cookie'

export default class Index extends React.Component {
  constructor() {
    super()

    this.state = {
      username: null,
    }
  }

  render() {
    return (
      <div style={styles.main}>
        <label>Enter your username</label>
        <br />
        <input
          type="text"
          class="input"
          id="username"
          name="username"
          value={this.state.username}
          onChange={event => {
            this.setState({ username: event.target.value })
          }}
        />
        <br />
        <button
          onClick={() => {
            cookie.set('username', this.state.username)
            Router.push(`/chatScreen`)
          }}
        >
          Join
        </button>
      </div>
    )
  }
}

const styles = {
  main: { fontFamily: 'monospace', padding: 30 },
  pre: {
    whiteSpace: 'pre',
    overflow: 'auto',
    background: '#333',
    maxHeight: 200,
    borderRadius: 6,
    padding: 5,
  },
  code: { display: 'block', wordWrap: 'normal', color: '#fff' },
}
