import { createClient } from '@supabase/supabase-js'
import cookie from 'js-cookie'
import moment from 'moment'

export default class ChatScreen extends React.Component {
  constructor() {
    super()
    this.supabase = createClient('https://world.supabase.co', '1a2b-3c4d-5e6f-7g8h')

    this.state = {
      username: cookie.get('username'),
      messages: [],
      message: null,
    }

    console.log(this.state)
  }
  componentDidMount() {
    this.subscribe()
    this.loadMessages()
  }

  subscribe() {
    let test = this.supabase
      .from('messages')
      .on('*', payload => {
        console.log('REALTIME! ', payload)
        let updatedMessages = this.state.messages
        updatedMessages.push(payload.record)
        
        this.setState({messages: updatedMessages})
      })
      .subscribe()
  }

  async loadMessages() {
    let messages = await this.supabase
      .from('messages')
      .select()
      .order('inserted_at', true)

    this.setState({ messages: messages.body })
  }

  async sendMessage() {
    let payload = {
      sender: this.state.username,
      message: this.state.message,
      inserted_at: moment().format()
    }
    
    await this.supabase
      .from('messages')
      .insert([payload])

    this.setState({message: ''})
  }

  render() {
    return (
      <div style={styles.main}>
        <h1>Hello</h1>
        {this.state.messages.map(message => {
          return (
            <p>
              {message.sender}: {message.message}
            </p>
          )
        })}
        <label>Say Something!</label>
        <input
          type="text"
          class="input"
          id="message"
          name="message"
          value={this.state.message}
          onChange={event => {
            this.setState({ message: event.target.value })
          }}
        />
        <br />
        <button
          onClick={() => {
            this.sendMessage()
          }}
        >
          Send
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
