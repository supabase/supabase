import SimplePeer from 'simple-peer'

export interface User {
  color: string
  hue: string
  stream: MediaStream
  remotePeer?: SimplePeer.Instance
}
