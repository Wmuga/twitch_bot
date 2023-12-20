import io from "socket.io-client";
import { MusicInfo } from "../Types/MusicInfo";
import { IOverlayServer } from "../interfaces/IOverlayServer";

export class OverlayServer implements IOverlayServer{
  private _socket: SocketIOClient.Socket;
  
  constructor(port:number){
    this._socket = io(`ws://localhost:${port}`, {transports: ['websocket'], autoConnect:false})
    this._socket.on('connect',()=>{
      console.log(`Socket to overlay working on port`,port)
      this._socket.emit('twitchBot')
    })
    this._socket.connect()
  }

  sendSong(song: MusicInfo | undefined): void {
    if (song == undefined){
      this._socket.emit('song','null')
      return
    }
    this._socket.emit('song',JSON.stringify(song))
  }

  sendViewer(viewerMsg: string): void {
    this._socket.emit('viewer',viewerMsg)
  }

  sendChat(size: string): void {
    this._socket.emit('chat',size)
  }

}