import { Socket } from 'phoenix-channels'

export default class BaseChannel {
    constructor(tableName, apiSocket){
        this.socket = new Socket(apiSocket)
        this.channel = this.socket.channel(tableName)
        this.listeners = {}

        this.start()

        this.socket.onOpen(() => {
            console.log('Socket connected')
        })
        this.socket.onClose(() => {
            console.log('Socket disconnected')
        })
    }

    on(eventName, callbackFunction){
        let ref = this.channel.on(eventName, callbackFunction)
        this.listeners[ref] = eventName
        return ref
    }

    off(eventName, ref = null){
        // if ref is null, we just want to remove everything that has the eventName
        if(typeof ref === 'null'){
            for (var ref in this.listeners){
                let eventNameValue = this.listeners[ref]
                if(eventName === eventNameValue){
                    this.off(eventName, ref)
                }
            }
        }

        this.channel.off(eventName, ref)
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