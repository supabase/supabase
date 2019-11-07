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

  stop(){
    this.listeners.forEach(({ messageName, messagae }) => {
      this.channel.off(messageName, message)
    })
    this.socket.disconnect()
  }

  /**
   * takes in an object with keys
   * - messageName
   * - messgage 
   * to:
   * 1. add to this.listener
   * 2. turn channel on
   * @param {object} listener
   */
  addListener(listener){
    this.listeners.push(listener)
    let { messageName, message } = listener
    
    this.channel.on(messageName, message)
  }

  /**
   * Takes in messageName string to:
   * 1. turn channel off
   * 2. remove specific listener from this.listener
   * @param {string} messageName 
   */
  removeListener(messageName){
    this.channel.off(mesageName)
    
    let updatedListeners = this.listeners.filter(listener => {
      let name = listener.messageName
      return name !== messageName
    })
    this.listeners = updatedListeners
  }
}