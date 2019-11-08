import { Socket } from 'phoenix-channels'

export default class Realtime {
  constructor(apiSocket){
    this.socket = new Socket(apiSocket)
    this.channel = this.socket.channel('realtime')
    this.listeners = []

    this.socket.onOpen(() => {
      console.log('Socket connected')
    })
    this.socket.onClose(() => {
      console.log('Socket disconnected')
    })
  }

  /**
   * Starts socket and all of its channels/ listeners
   * 
   * @param {Array} listeners
   * @param {Object} listeners[n]
   * @param {String} listener.channel The name of channel
   * @param {Function} listener.callback The callback function to fire when the channel receives a change
   */
  start(listeners) {
    this.socket.connect()
    if (this.channel.state !== 'joined'){
      this.channel
        .join()
        .receive('ok', resp => console.log('Joined Realtime successfully', resp))
        .receive('error', resp => console.log('Unable to join', resp))
        .receive('timeout', () => console.log('Networking issue. Still waiting...'))

      listeners.forEach( listener => {
        this.addListener(listener)
      })
    }
  }

  /**
   * Stops socket and all of its channels/ listeners
   */
  stop(){
    this.listeners.forEach(({ channel, callback }) => {
      this.channel.off(channel, callback)
    })
    this.socket.disconnect()
  }

  /**
   * Adds a listener to the socket and activates it
   * 
   * @param {Object} listener
   * @param {String} listener.channel The name of channel
   * @param {Function} listener.callback The callback function to fire when the channel receives a change
   * 
   * @example
   * addListener({channel: 'shout', callback: () => {}})
   */
  addListener(listener){
    this.listeners.push(listener)
    let { channel, callback } = listener
    
    this.channel.on(channel, callback)
  }

  /**
   * Takes in String channel to:
   * 1. turn channel off
   * 2. remove specific listener from this.listener
   * 
   * @param {String} channel 
   * 
   * @example
   * removeListener('shout')
   */
  removeListener(channel){
    this.channel.off(channel)
    
    let updatedListeners = this.listeners.filter(listener => {
      let channelName = listener.channel
      return channelName !== channel
    })
    this.listeners = updatedListeners
  }
}