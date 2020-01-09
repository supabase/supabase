import { Socket } from 'phoenix-channels'

export default class BaseChannel {
    constructor(tableName, apiSocket, uuid){
        this.socket = new Socket(apiSocket)
        this.uuid = uuid
        this.channel = this.socket.channel(tableName)

        this.start()

        this.socket.onOpen(() => {
            console.log('Socket connected')
        })
        this.socket.onClose(() => {
            console.log('Socket disconnected')
        })
    }

    on(eventName, callbackFunction){
        this.channel.on(eventName, callbackFunction)
    }

    start(){
        this.socket.connect()

        if(this.channel.state !== 'joined'){
            this.channel
                .join()
                .receive('ok', resp => console.log('Joined Realtime successfully ', resp))
                .receive('error', resp => console.log('Unable to join ', resp))
                .receive('timeout', () => console.log('Networking issue. Still waiting...'))
        }
    }

    stop(){
        for (var ref in this.listeners){
            let eventName = this.listeners[ref]
            this.off(eventName, ref)
        }

        this.socket.disconnect()
    }
}